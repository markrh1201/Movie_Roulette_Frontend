import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Matter from 'matter-js';

// --- Configuration ---
const OMDB_API_KEY = '97e5bf2a'; // Note: Better to store API keys in environment variables.

// Fallback data for testing if no state is passed through the router
const MOCK_MOVIES = [
  { title: 'The Matrix' },
  { title: 'Inception' },
  { title: 'Interstellar' },
  { title: 'Parasite' },
  { title: 'The Lord of the Rings: The Fellowship of the Ring' },
];

// --- Helper Functions ---
const fetchPoster = async (movie) => {
  const placeholder = 'https://placehold.co/300x450/2d3748/ffffff?text=No+Poster';
  try {
    const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const posterUrl = data?.Poster;

    if (posterUrl && posterUrl !== 'N/A') {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = posterUrl;
        img.onload = () => resolve({ ...movie, poster: posterUrl, id: data.imdbID || crypto.randomUUID() });
        img.onerror = () => resolve({ ...movie, poster: placeholder, id: data.imdbID || crypto.randomUUID() });
      });
    } else {
      return { ...movie, poster: placeholder, id: data.imdbID || crypto.randomUUID() };
    }
  } catch (error) {
    console.error(`Poster fetch error for "${movie.title}":`, error);
    return { ...movie, poster: placeholder, id: movie.title };
  }
};

/**
 * Generates pegs, paddles, and wall funnels for the course, ensuring no obstacles overlap
 * or create gaps too small for a racer to pass through.
 * @param {number} width - The width of the scene.
 * @param {number} height - The total height of the scene.
 * @returns {object} An object containing arrays of pegs, paddles, and funnels.
 */
const generateObstacles = (width, height) => {
    const pegs = [];
    const paddles = [];
    const funnels = [];

    const existingObstacles = []; // Will store { x, y, clearance } for all obstacles

    const pegCount = 800;
    const pegRadius = 10;
    const paddleCount = 20;
    const paddleWidth = 150;
    const funnelCountPerSide = 16;
    const funnelWidth = 200;
    const racerRadius = 40; // The radius of the ball itself
    const racerDiameter = racerRadius * 2; // The full width of the ball
    const safetyMargin = 10; // Extra buffer space

    const startY = 300;
    const endY = height - 300;
    const wallPadding = 100;

    // 1. Generate Wall Funnels
    for (let i = 0; i < funnelCountPerSide; i++) {
        const y = startY + (i + 1) * ((endY - startY) / (funnelCountPerSide + 1));
        const angle = Math.PI / 6;

        const leftFunnel = { id: crypto.randomUUID(), x: wallPadding / 2, y, width: funnelWidth, height: 15, angle };
        funnels.push(leftFunnel);
        existingObstacles.push({ x: leftFunnel.x, y: leftFunnel.y, clearance: leftFunnel.width / 2 });

        const rightFunnel = { id: crypto.randomUUID(), x: width - wallPadding / 2, y, width: funnelWidth, height: 15, angle: -angle };
        funnels.push(rightFunnel);
        existingObstacles.push({ x: rightFunnel.x, y: rightFunnel.y, clearance: rightFunnel.width / 2 });
    }

    // 2. Generate Paddles
    for (let i = 0; i < paddleCount; i++) {
        let x, y, validPosition;
        let attempts = 0;
        const paddleClearance = paddleWidth / 2;

        do {
            validPosition = true;
            x = wallPadding + paddleClearance + Math.random() * (width - (wallPadding + paddleClearance) * 2);
            y = startY + Math.random() * (endY - startY);

            for (const obs of existingObstacles) {
                const distance = Math.sqrt(Math.pow(obs.x - x, 2) + Math.pow(obs.y - y, 2));
                // Ensure space for the paddle, the existing obstacle, AND a racer to pass between them
                if (distance < (obs.clearance + paddleClearance + racerDiameter + safetyMargin)) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        } while (!validPosition && attempts < 50);

        if (validPosition) {
            const newPaddle = { id: crypto.randomUUID(), x, y, width: paddleWidth, height: 20 };
            paddles.push(newPaddle);
            existingObstacles.push({ x: newPaddle.x, y: newPaddle.y, clearance: paddleClearance });
        }
    }

    // 3. Generate Pegs
    for (let i = 0; i < pegCount; i++) {
        let x, y, validPosition;
        let attempts = 0;
        const pegClearance = pegRadius;

        do {
            validPosition = true;
            x = wallPadding + Math.random() * (width - wallPadding * 2);
            y = startY + Math.random() * (endY - startY);

            for (const obs of existingObstacles) {
                const distance = Math.sqrt(Math.pow(obs.x - x, 2) + Math.pow(obs.y - y, 2));
                // Ensure space for the peg, the existing obstacle, AND a racer to pass between them
                if (distance < (obs.clearance + pegClearance + racerDiameter + safetyMargin)) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        } while (!validPosition && attempts < 50);

        if (validPosition) {
            const newPeg = { x, y, radius: pegRadius };
            pegs.push(newPeg);
            existingObstacles.push({ x: newPeg.x, y: newPeg.y, clearance: pegClearance });
        }
    }

    return { pegs, paddles, funnels };
};

const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


// --- Core Race Component ---
const Race = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { movies = MOCK_MOVIES } = location.state || {};

  const [posters, setPosters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startRace, setStartRace] = useState(false);
  const [winner, setWinner] = useState(null);
  const [pegs, setPegs] = useState([]);
  const [paddles, setPaddles] = useState([]);
  const [funnels, setFunnels] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [cameraTarget, setCameraTarget] = useState('leader'); // 'leader' or racer ID
  
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const posterRefs = useRef([]);
  const labelRefs = useRef([]);
  const paddleRefs = useRef([]);
  const funnelRefs = useRef([]);
  const animationFrameRef = useRef();
  const leaderboardDataRef = useRef([]);
  const cameraTargetRef = useRef('leader'); // Use ref for access inside animation loop

  useEffect(() => {
    cameraTargetRef.current = cameraTarget;
  }, [cameraTarget]);

  useEffect(() => {
    const fetchAllPosters = async () => {
      setIsLoading(true);
      const fetchedPosters = await Promise.all(movies.map(fetchPoster));
      setPosters(fetchedPosters);
      setLeaderboard(fetchedPosters.map(p => ({...p, y: 0}))); // Pre-populate leaderboard
      setIsLoading(false);
    };
    if (movies && movies.length > 0) fetchAllPosters(); else setIsLoading(false);
  }, [movies]);

  // This effect handles the stopwatch and leaderboard UI updates
  useEffect(() => {
    if (!startRace || winner) return;

    const stopwatchInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);

    const leaderboardInterval = setInterval(() => {
        setLeaderboard([...leaderboardDataRef.current]);
    }, 250); // Update leaderboard UI 4 times a second

    return () => {
        clearInterval(stopwatchInterval);
        clearInterval(leaderboardInterval);
    };
  }, [startRace, winner]);

  // This effect handles keyboard input for camera control
  useEffect(() => {
    const handleKeyDown = (event) => {
        if (!startRace || winner) return;

        const keyNumber = parseInt(event.key, 10);

        if (keyNumber >= 1 && keyNumber <= 9) {
            const targetRacer = leaderboardDataRef.current[keyNumber - 1];
            if (targetRacer) {
                setCameraTarget(targetRacer.id);
            }
        } else if (event.key === '0') {
            setCameraTarget('leader'); // Switch back to following the leader
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startRace, winner]);

  // This effect handles the physics engine
  useEffect(() => {
    if (!startRace || posters.length === 0 || !sceneRef.current) return;

    const engine = engineRef.current;
    const world = engine.world;
    
    setWinner(null);
    Matter.World.clear(world);
    Matter.Engine.clear(engine);

    engine.world.gravity.y = 0.25;

    const sceneWidth = sceneRef.current.clientWidth;
    const sceneHeight = window.innerHeight * 20; // Increased height for a ~2-minute race
    sceneRef.current.style.height = `${sceneHeight}px`;
    const bodyRadius = 40;

    const { pegs: pegLayout, paddles: paddleLayout, funnels: funnelLayout } = generateObstacles(sceneWidth, sceneHeight);
    setPegs(pegLayout);
    setPaddles(paddleLayout);
    setFunnels(funnelLayout);

    const pegBodies = pegLayout.map(p => Matter.Bodies.circle(p.x, p.y, p.radius, { isStatic: true, restitution: 0.6, friction: 0 }));

    const funnelBodies = funnelLayout.map(f => Matter.Bodies.rectangle(f.x, f.y, f.width, f.height, {
        isStatic: true,
        angle: f.angle,
        restitution: 0.8,
        friction: 0
    }));

    const paddleBodies = [];
    const paddleConstraints = [];
    paddleLayout.forEach((p, index) => {
        const paddleBody = Matter.Bodies.rectangle(p.x, p.y, p.width, p.height, {
            restitution: 0.5,
            friction: 0.1,
            density: 0.1,
            label: `paddle-${index}`,
            chamfer: { radius: 5 }
        });
        paddleBodies.push(paddleBody);
        
        const pivotX = p.x - p.width / 2;
        const pivotOffset = { x: -p.width / 2, y: 0 };
        const constraint = Matter.Constraint.create({
            bodyB: paddleBody,
            pointA: { x: pivotX, y: p.y },
            pointB: pivotOffset,
            stiffness: 1,
            length: 0
        });
        paddleConstraints.push(constraint);
    });

    const ground = Matter.Bodies.rectangle(sceneWidth / 2, sceneHeight, sceneWidth, 60, { isStatic: true });
    const wallLeft = Matter.Bodies.rectangle(0, sceneHeight / 2, 10, sceneHeight, { isStatic: true });
    const wallRight = Matter.Bodies.rectangle(sceneWidth, sceneHeight / 2, 10, sceneHeight, { isStatic: true });
    const ceiling = Matter.Bodies.rectangle(sceneWidth / 2, 0, sceneWidth, 60, { isStatic: true }); // Thicker ceiling
    const finishLineY = sceneHeight - 120; 
    const finishLine = Matter.Bodies.rectangle(sceneWidth / 2, finishLineY, sceneWidth, 10, { isStatic: true, isSensor: true, label: 'finishLine' });

    const racerBodies = posters.map((movie, i) => {
      const x = ((i + 1) * sceneWidth) / (posters.length + 1) + (Math.random() - 0.5) * 10;
      return Matter.Bodies.circle(x, 100, bodyRadius, { restitution: 0.5, friction: 0.01, label: `racer-${movie.id}` });
    });

    Matter.World.add(world, [ground, wallLeft, wallRight, ceiling, finishLine, ...pegBodies, ...paddleBodies, ...paddleConstraints, ...racerBodies, ...funnelBodies]);
    
    let currentWinner = null;
    Matter.Events.on(engine, 'collisionStart', (event) => {
        if (currentWinner) return;

        for (const pair of event.pairs) {
            const { bodyA, bodyB } = pair;
            let racerBody, otherBody;
            if (bodyA.label.startsWith('racer-')) { [racerBody, otherBody] = [bodyA, bodyB]; }
            else if (bodyB.label.startsWith('racer-')) { [racerBody, otherBody] = [bodyB, bodyA]; }
            else { continue; }

            if (otherBody.label === 'finishLine') {
                const winnerId = racerBody.label.replace('racer-', '');
                const winnerInfo = posters.find(p => p.id === winnerId);
                if (winnerInfo) { currentWinner = winnerInfo; setWinner(winnerInfo); }
            } 
            else if (otherBody.label.startsWith('paddle-')) {
                const paddleBody = otherBody;
                if (Math.abs(paddleBody.angle) < 0.1) {
                    const flipVelocity = -0.4; // Reduced power again
                    Matter.Body.setAngularVelocity(paddleBody, flipVelocity);
                }
            }
        }
    });
    
    Matter.Events.on(engine, 'beforeUpdate', () => {
        paddleBodies.forEach(paddleBody => {
            if (paddleBody.angle < -Math.PI / 2) { 
                Matter.Body.setAngle(paddleBody, -Math.PI / 2);
                Matter.Body.setAngularVelocity(paddleBody, 0);
            } else {
                const restoringTorque = paddleBody.angle * 0.05;
                paddleBody.torque += restoringTorque;
            }
            
            Matter.Body.setAngularVelocity(paddleBody, paddleBody.angularVelocity * 0.92);

            if (Math.abs(paddleBody.angle) < 0.02 && Math.abs(paddleBody.angularVelocity) < 0.02) {
                Matter.Body.setAngle(paddleBody, 0);
                Matter.Body.setAngularVelocity(paddleBody, 0);
            }
        });
    });
    
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    const updateDOMPositions = () => {
        if (currentWinner) {
            cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        racerBodies.forEach((body, index) => {
            const posterEl = posterRefs.current[index];
            const labelEl = labelRefs.current[index];
            if (posterEl) posterEl.style.transform = `translate(${body.position.x - bodyRadius}px, ${body.position.y - bodyRadius}px)`;
            if (labelEl) labelEl.style.transform = `translate(${body.position.x - labelEl.offsetWidth / 2}px, ${body.position.y - bodyRadius - 30}px)`;
        });

        paddleBodies.forEach((body, index) => {
            const paddleEl = paddleRefs.current[index];
            const paddleInfo = paddleLayout[index];
            if (paddleEl) {
                const x = body.position.x - paddleInfo.width / 2;
                const y = body.position.y - paddleInfo.height / 2;
                paddleEl.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
            }
        });

        funnelLayout.forEach((funnel, index) => {
            const funnelEl = funnelRefs.current[index];
            if (funnelEl) {
                const x = funnel.x - funnel.width / 2;
                const y = funnel.y - funnel.height / 2;
                funnelEl.style.transform = `translate(${x}px, ${y}px) rotate(${funnel.angle}rad)`;
            }
        });

        leaderboardDataRef.current = racerBodies
            .map((body, index) => ({...posters[index], y: body.position.y }))
            .sort((a, b) => b.y - a.y);
        
        let targetY = 0;
        if (cameraTargetRef.current === 'leader') {
            racerBodies.forEach(body => { if (body.position.y > targetY) targetY = body.position.y; });
        } else {
            const targetBody = racerBodies.find(body => body.label === `racer-${cameraTargetRef.current}`);
            if (targetBody) {
                targetY = targetBody.position.y;
            } else { // Fallback to leader if target not found
                racerBodies.forEach(body => { if (body.position.y > targetY) targetY = body.position.y; });
            }
        }

        if (targetY > 0) {
            const targetScroll = targetY - (window.innerHeight / 3);
            window.scrollTo(0, window.scrollY + (targetScroll - window.scrollY) * 0.1);
        }

        animationFrameRef.current = requestAnimationFrame(updateDOMPositions);
    };
    
    updateDOMPositions();

    return () => {
      Matter.Events.off(engine);
      cancelAnimationFrame(animationFrameRef.current);
      Matter.Runner.stop(runner);
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, [startRace, posters]);

  const handleRestart = () => {
      setWinner(null);
      setStartRace(false);
      window.scrollTo(0, 0);
      setElapsedTime(0);
      setCameraTarget('leader');
      setTimeout(() => setStartRace(true), 100);
  };

  return (
    <div className="relative w-full bg-gray-900 text-white">
        {winner && (
            <div className="fixed inset-0 bg-black/70 flex flex-col justify-center items-center z-50 animate-fade-in">
                <h2 className="text-2xl text-gray-300 mb-2">The Winner Is...</h2>
                <h1 className="text-5xl font-bold text-yellow-400 mb-4 text-center px-4">{winner.title}</h1>
                <img src={winner.poster} alt={`Poster for ${winner.title}`} className="w-48 h-auto rounded-lg shadow-2xl mb-8 border-4 border-yellow-400"/>
                <div className="flex gap-4">
                    <button onClick={handleRestart} className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105">
                        🏁 Race Again
                    </button>
                    <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105">
                        🔙 New Setup
                    </button>
                </div>
            </div>
        )}

      <h1 className="fixed top-0 w-full bg-gray-900/50 backdrop-blur-sm py-4 text-4xl font-bold z-20 text-center tracking-wider">
        🏁 Movie Race 🏁
      </h1>

      {/* --- Race Info overlay --- */}
      <div className="fixed top-24 right-4 z-30 w-64 p-4 bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-700">
        <div className="text-lg font-bold mb-3 text-yellow-400">
            <span className="font-mono">{formatTime(elapsedTime)}</span>
        </div>
        <h3 className="font-bold text-lg mb-2">Leaderboard</h3>
        <ol className="space-y-2">
            {leaderboard.map((racer, index) => (
                <li key={racer.id} className={`flex items-center gap-3 text-sm p-1 rounded-md transition-colors ${cameraTarget === racer.id ? 'bg-yellow-500/30' : 'bg-transparent'}`}>
                    <span className="font-bold text-gray-400 w-5">{index + 1}.</span>
                    <img src={racer.poster} alt={racer.title} className="w-8 h-12 object-cover rounded-sm"/>
                    <span className="truncate">{racer.title}</span>
                </li>
            ))}
        </ol>
        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
            Press <span className="font-bold text-gray-300">1-9</span> to follow a racer. Press <span className="font-bold text-gray-300">0</span> to follow the leader.
        </p>
      </div>
      
      <div ref={sceneRef} className="relative w-full z-0">
        {posters.map((movie, index) => (
          <React.Fragment key={movie.id}>
            <div
              ref={(el) => (posterRefs.current[index] = el)}
              className="absolute bg-cover bg-center rounded-full shadow-lg border-2 border-white/50"
              style={{ width: `80px`, height: `80px`, backgroundImage: `url(${movie.poster})`, transform: 'translate(-9999px, -9999px)' }}
            />
            <div
              ref={(el) => (labelRefs.current[index] = el)}
              className="absolute text-center font-semibold text-xs z-10 bg-black/60 text-white px-2 py-1 rounded-md shadow-xl"
              style={{ transform: 'translate(-9999px, -9999px)', whiteSpace: 'nowrap' }}
            >
              {movie.title}
            </div>
          </React.Fragment>
        ))}
        {pegs.map((peg, i) => (
            <div key={i} className="absolute bg-gray-600 rounded-full shadow-inner" style={{
                left: `${peg.x - peg.radius}px`, top: `${peg.y - peg.radius}px`,
                width: `${peg.radius * 2}px`, height: `${peg.radius * 2}px`,
            }}/>
        ))}
        {paddles.map((paddle, index) => (
            <div key={paddle.id} ref={(el) => (paddleRefs.current[index] = el)}
                 className="absolute bg-orange-500 rounded-lg shadow-lg border-2 border-orange-300"
                 style={{
                    transform: 'translate(-9999px, -9999px)',
                    width: `${paddle.width}px`, height: `${paddle.height}px`,
                    transformOrigin: 'left center'
                 }}
            />
        ))}
        {funnels.map((funnel, index) => (
             <div key={funnel.id} ref={(el) => (funnelRefs.current[index] = el)}
                 className="absolute bg-teal-600 rounded-md"
                 style={{
                    transform: 'translate(-9999px, -9999px)',
                    width: `${funnel.width}px`, height: `${funnel.height}px`,
                 }}
            />
        ))}
        <div className="absolute left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 z-10" style={{ bottom: '120px' }}>
            <div className="absolute -top-7 w-full text-center text-xl font-bold text-white tracking-widest uppercase">Finish</div>
        </div>
      </div>
      
      <div className="fixed bottom-0 w-full flex justify-center gap-4 p-4 bg-gray-900/50 backdrop-blur-sm z-20">
        {isLoading ? (
          <div className="px-6 py-3 bg-gray-600 text-white rounded-lg animate-pulse">Loading Posters...</div>
        ) : (
          !startRace && (
            <button
              onClick={() => { 
                  window.scrollTo(0,0);
                  setElapsedTime(0);
                  setStartRace(true); 
                }}
              className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 shadow-lg"
              disabled={!movies || movies.length === 0}
            >
              🎬 Start Race
            </button>
          )
        )}
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-transform transform hover:scale-105 shadow-lg"
        >
          🔙 New Setup
        </button>
      </div>
    </div>
  );
};

export default Race;
