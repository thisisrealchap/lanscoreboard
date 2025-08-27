import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import generateMatches from '../utils/generateMatches';

const TournamentForm = () => {
  const [gameName, setGameName] = useState('');
  const [isTeamBased, setIsTeamBased] = useState(false);
  const [format, setFormat] = useState('BO1');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const tournamentRef = await addDoc(collection(db, 'tournaments'), {
        name: gameName,
        isTeamBased,
        format,
        createdAt: new Date(),
        winner: null
      });

      // Génération automatique des matchs
      await generateMatches(tournamentRef.id, isTeamBased);

      setGameName('');
      setIsTeamBased(false);
      setFormat('BO1');
    } catch (error) {
      console.error("Erreur lors de la création :", error);
    }
  };

  return (
    <div className="tournament-form-container">
      <h2>Créer un tournoi 🎮</h2>
      <form onSubmit={handleSubmit} className="tournament-form">
        <label>
          Nom du jeu :
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            required
          />
        </label>

        <label>
          Format :
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="BO1">BO1</option>
            <option value="BO3">BO3</option>
            <option value="BO5">BO5</option>
          </select>
        </label>

        <label>
          Type de tournoi :
          <select
            value={isTeamBased ? 'team' : 'solo'}
            onChange={(e) => setIsTeamBased(e.target.value === 'team')}
          >
            <option value="solo">Duel 1v1</option>
            <option value="team">Équipes</option>
          </select>
        </label>

        <button type="submit">Créer le tournoi 🚀</button>
      </form>
    </div>
  );
};

export default TournamentForm;
