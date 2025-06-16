import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Matter from 'matter-js';

const OMDB_API_KEY = '97e5bf2a'; // Replace with your actual OMDb key

const Race = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { movies } = location.state || { movies: [] };

  const [posters, setPosters] = useState([]);
  const [startRace, setStartRace] = useState(false);
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const labelRefs = useRef([]);

  useEffect(() => {
    const fetchPosters = async () => {
      const fetched = await Promise.all(
        movies.map(async (movie) => {
          try {
            const res = await axios.get(
              `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movie.title)}`
            );
            const validPoster =
              res.data?.Poster &&
              res.data.Poster !== 'N/A' &&
              res.data.Poster.startsWith('http');

            const poster = validPoster
              ? res.data.Poster
              : 'https://via.placeholder.com/100x150?text=No+Poster';

            return { ...movie, poster };
          } catch (error) {
            console.error(`Poster fetch error for "${movie.title}":`, error);
            return {
              ...movie,
              poster: 'https://via.placeholder.com/100x150?text=Error',
            };
          }
        })
      );
      setPosters(fetched);
    };

    if (movies.length > 0) {
      fetchPosters();
    }
  }, [movies]);

  useEffect(() => {
    if (!startRace || posters.length === 0) return;

    const engine = engineRef.current;
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
      },
    });

    const { World, Bodies, Runner, Events } = Matter;

    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight,
      window.innerWidth,
      50,
      { isStatic: true }
    );

    const bodies = posters.map((movie, i) => {
      const x = ((i + 1) * window.innerWidth) / (posters.length + 1);
      const y = 150;
      return Bodies.circle(x, y, 40, {
        restitution: 0.6,
        label: movie.title,
        render: {
          sprite: {
            texture: movie.poster,
            xScale: 80 / 300,
            yScale: 80 / 300, // Force square scaling for circular fit
          },
        },
      });
    });

    World.add(engine.world, [ground, ...bodies]);
    Matter.Engine.run(engine);
    Matter.Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const updateLabels = () => {
      bodies.forEach((body, index) => {
        const ref = labelRefs.current[index];
        if (ref) {
          ref.style.transform = `translate(${body.position.x - ref.offsetWidth / 2}px, ${body.position.y - 70}px)`;
        }
      });
    };

    // Lock sprite rotation to keep it upright
    Events.on(engine, 'beforeUpdate', () => {
      bodies.forEach(body => {
        body.angle = 0;
        body.angularVelocity = 0;
      });
    });

    Events.on(engine, 'afterUpdate', updateLabels);

    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(engine.world);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [startRace, posters]);

  return (
    <div className="relative min-h-screen bg-blue-50 p-6 flex flex-col items-center overflow-hidden">
      {/* HEADER */}
      <h1 className="text-4xl font-bold mb-4 z-10 relative">🏁 Movie Race</h1>

      {/* PHYSICS SCENE */}
      <div
        ref={sceneRef}
        className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      ></div>

      {/* LABELS */}
      {posters.map((movie, index) => (
        <div
          key={index}
          ref={(el) => (labelRefs.current[index] = el)}
          className="absolute text-center font-semibold text-sm z-10 bg-white/70 px-1 rounded"
          style={{ transform: 'translate(-9999px, -9999px)', whiteSpace: 'nowrap' }}
        >
          {movie.title}
        </div>
      ))}

      {/* CONTROLS AT BOTTOM */}
      <div className="absolute bottom-6 flex gap-4 z-20">
        {!startRace && (
          <button
            onClick={() => setStartRace(true)}
            className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            🎬 Start Race
          </button>
        )}
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          🔙 Back Home
        </button>
      </div>
    </div>
  );
};

export default Race;
