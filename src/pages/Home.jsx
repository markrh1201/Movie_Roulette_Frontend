import React, { useState, useEffect } from 'react';
import AddMovieForm from '../components/AddMovieForm';
import MovieCard from '../components/MovieCard';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ... (imports remain the same)

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [isRaceOpen, setIsRaceOpen] = useState(false);
  const [randomPick, setRandomPick] = useState(false);
  const [numberOfRandomMovies, setNumberOfRandomMovies] = useState(1);
  const [selectedMovies, setSelectedMovies] = useState([]);

  const navigate = useNavigate();

  const fetchMovies = async () => {
    const res = await axios.get('http://localhost:5000/api/movies');
    setMovies(res.data);
  };

  const addMovie = async (title, addedBy) => {
    try {
      const res = await axios.post('http://localhost:5000/api/movies', { title, addedBy });
      setMovies((prevMovies) => [...prevMovies, res.data]);
    } catch (error) {
      console.error('Error adding movie:', error);
    }
  };
  
  const deleteMovie = async (id) => {
    await axios.delete(`http://localhost:5000/api/movies/${id}`);
    setMovies(movies.filter(movie => movie._id !== id));
    setSelectedMovies(selectedMovies.filter(mid => mid !== id)); // remove from selected if deleted
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const openRaceModal = () => {
    setIsRaceOpen(true);
  };

  const closeRaceModal = () => {
    setIsRaceOpen(false);
  };

  const handleToggleRace = (movieId) => {
    setSelectedMovies(prev =>
      prev.includes(movieId)
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const startRace = () => {
    let selected = movies.filter(movie => selectedMovies.includes(movie._id));
  
    if (randomPick) {
      const remainingMovies = movies.filter(movie => !selected.includes(movie));
      const shuffled = [...remainingMovies].sort(() => 0.5 - Math.random());
      const randomSelection = shuffled.slice(0, Math.min(numberOfRandomMovies, shuffled.length));
      selected = [...selected, ...randomSelection];
    }
  
    return selected;
  };
  

  return (
    <div className="relative min-h-screen bg-gray-100 p-6 overflow-hidden">
      <div className={`${isRaceOpen ? 'filter blur-sm' : ''} transition-all duration-300`}>
        <h1 className="text-4xl font-bold text-center mb-6">🎬 Movie Roulette</h1>

        <AddMovieForm onAdd={addMovie} />

        <div className="flex justify-center">
          <button 
            onClick={openRaceModal} 
            className="px-6 py-3 mt-4 text-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition"
          >
            🎲 Race!
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {movies.map(movie => (
            <MovieCard
              key={movie._id}
              movie={movie}
              onDelete={deleteMovie}
              isInRace={selectedMovies.includes(movie._id)}
              onToggleRace={handleToggleRace}
          />
          
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isRaceOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>

            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center z-10"
            >
              <button
                onClick={closeRaceModal}
                className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 text-2xl"
              >
                ❌
              </button>

              <h2 className="text-2xl font-bold mb-4">Race Settings</h2>

              <div className="flex items-center justify-center mb-4">
                <input 
                  type="checkbox" 
                  id="randomPick"
                  checked={randomPick}
                  onChange={(e) => setRandomPick(e.target.checked)}
                  className="mr-2 w-4 h-4"
                />
                <label htmlFor="randomPick" className="text-sm font-medium">
                  Randomly pick movies?
                </label>
              </div>

              {randomPick && (
                <div className="flex flex-col items-center mb-4">
                  <label htmlFor="numberOfMovies" className="text-sm font-medium mb-1">
                    Number of Movies:
                  </label>
                  <input 
                    type="number" 
                    id="numberOfMovies"
                    min="1"
                    value={numberOfRandomMovies}
                    onChange={(e) => setNumberOfRandomMovies(Number(e.target.value))}
                    className="border rounded px-2 py-1 w-20 text-center"
                  />
                </div>
              )}

              <button 
                onClick={() => {
                  const moviesToRace = startRace();
                  navigate('/race', { state: { movies: moviesToRace } });
                }}
                className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Start Race
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;

