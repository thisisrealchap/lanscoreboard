import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // adapte ce chemin selon ta config firebase

export default function ChallengeCard({ challenge, players }) {
  const [winner, setWinner] = useState(challenge.winner || null);
  const [selectVisible, setSelectVisible] = useState(!winner);

  async function handleWinnerChange(e) {
    const selectedPlayerId = e.target.value;
    setWinner(selectedPlayerId);
    setSelectVisible(false);

    try {
      const playerDocRef = doc(db, 'players', selectedPlayerId);
      const challengeDocRef = doc(db, 'challenges', challenge.id);

      await updateDoc(playerDocRef, {
        score: players.find(p => p.id === selectedPlayerId).score + 3
      });

      await updateDoc(challengeDocRef, {
        winner: selectedPlayerId
      });
    } catch (error) {
      console.error("Erreur lors de l'attribution du gagnant :", error);
      setWinner(null);
      setSelectVisible(true);
    }
  }

  async function resetWinner() {
    try {
      if (!winner) return;

      const playerDocRef = doc(db, 'players', winner);
      const challengeDocRef = doc(db, 'challenges', challenge.id);

      await updateDoc(playerDocRef, {
        score: players.find(p => p.id === winner).score - 3
      });

      await updateDoc(challengeDocRef, {
        winner: null
      });

      setWinner(null);
      setSelectVisible(true);
    } catch (error) {
      console.error("Erreur lors du reset du gagnant :", error);
    }
  }

  return (
    <div className="challenge-card">
      <h3>{challenge.name} {challenge.smiley}</h3>
      <p>Récompense : {challenge.prize}</p>

      {selectVisible ? (
        <select onChange={handleWinnerChange} defaultValue="">
          <option value="" disabled>Choisir gagnant</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : (
        <p>Gagnant : {players.find(p => p.id === winner)?.name || 'Inconnu'}</p>
      )}

      {!selectVisible && (
        <button onClick={resetWinner} className="btn reset-btn">
          Réinitialiser
        </button>
      )}
    </div>
  );
}
