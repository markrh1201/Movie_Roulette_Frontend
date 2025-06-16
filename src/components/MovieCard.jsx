import React from 'react';
import { X } from 'lucide-react';

const MovieCard = ({ movie, onDelete, onToggleRace, isInRace }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isInRace}
            onChange={() => onToggleRace(movie._id)}
            className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div>
            <h3 className="font-medium text-lg">{movie.title}</h3>
            {movie.addedBy && (
              <p className="text-sm text-gray-500 mt-1">
                Added by: <span className="text-gray-700">{movie.addedBy}</span>
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={() => onDelete(movie._id)} 
          className="text-red-500 hover:text-red-700 transition-colors duration-200"
          aria-label="Delete movie"
        >
          <X size={20} />
        </button>
      </div>
      {movie.addedAt && (
        <p className="text-xs text-gray-400 mt-2">
          Added on: {new Date(movie.addedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default MovieCard;