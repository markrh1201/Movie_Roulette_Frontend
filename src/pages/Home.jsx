import React, { useState, useEffect } from 'react';
import AddMovieForm from '../components/AddMovieForm';
import MovieCard from '../components/MovieCard';
import axios from 'axios';

const Home = () => {
  const [movies, setMovies] = useState([]);

  const fetchMovies = async () => {
    const res = await axios.get('http://localhost:5000/api/movies');
    setMovies(res.data);
  };

  const addMovie = async (title, addedBy) => {
    try {
      const res = await axios.post('http://localhost:5000/api/movies', { title, addedBy });
      setMovies([...movies, res.data]);
    } catch (error) {
      console.error('Error adding movie:', error);
      // You might want to add user feedback here
    }
  };

  const deleteMovie = async (id) => {
    await axios.delete(`http://localhost:5000/api/movies/${id}`);
    setMovies(movies.filter(movie => movie._id !== id));
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-center mb-6">🎬 Movie Roulette</h1>
      <AddMovieForm onAdd={addMovie} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {movies.map(movie => (
          <MovieCard key={movie._id} movie={movie} onDelete={deleteMovie} />
        ))}
      </div>
    </div>
  );
};

export default Home;
