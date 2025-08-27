import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import generateMatches from '../utils/generateMatches';
import '../styles/TournamentForm.css'; // Garde ce chemin correct

const TournamentForm = ({ onCreated }) => {
  const [gameName, setGameName] = useState('');
  const [isTeamBased, setIsTeamBased] = useState(false);
  const [format, setFormat] = useState('BO1');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const tournamentRef = await addDoc(collection(db, "tournaments"), {
        name: gameName,
        isTeamBased,
        format,
        createdAt: new Date(),
        winner: null
      });

      await generateMatches(tournamentRef.id, isTeamBased);

      setGameName('');
      setIsTeamBased(false);
      setFormat('BO1');

      if (onCreated) onCreated(); // <--- Appel du callback si défini
    } catch (error) {
      console.error("Erreur lors de la création :", error);
    }
  };

  return (
    <form className="tournament-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nom du jeu"
        value={gameName}
        onChange={(e) => setGameName(e.target.value)}
        required
      />
      <label>
        <input
          type="checkbox"
          checked={isTeamBased}
          onChange={() => setIsTeamBased(!isTeamBased)}
        />
        Tournoi par équipes
      </label>
      <select value={format} onChange={(e) => setFormat(e.target.value)}>
        <option value="BO1">BO1</option>
        <option value="BO3">BO3</option>
        <option value="BO5">BO5</option>
      </select>
      <button type="submit">Créer Tournoi</button>
    </form>
  );
};

export default TournamentForm;
