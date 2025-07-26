// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Scoreboard from './components/scoreboard';
import TournamentPage from './pages/TournamentPage';

function App() {
  return (
    <Router>
      <div className="bg-black min-h-screen p-4">
        <nav className="flex justify-between mb-4">
          <Link to="/" className="text-white font-bold">🏠 Scoreboard</Link>
          <Link to="/tournoi" className="text-white font-bold">🏆 Tournoi</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Scoreboard />} />
          <Route path="/tournoi" element={<TournamentPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
