import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const RaceButton = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate('/race')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-6 py-3 mt-4 text-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg"
    >
      🎲 Race!
    </motion.button>
  );
};

export default RaceButton;