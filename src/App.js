import React from 'react';
import Home from './pages/Home';
import Race from './pages/Race'
import './output.css'; // Make sure this is the compiled Tailwind CSS
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/race" element={<Race />} />
      </Routes>
    </Router>
  );
}

export default App;
