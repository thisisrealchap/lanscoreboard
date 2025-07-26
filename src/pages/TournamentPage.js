// src/pages/TournamentPage.js
import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import TournamentForm from '../components/TournamentForm';
import '../styles/TournamentPage.css';

function TournamentPage() {
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState({});

  const fetchTournaments = async () => {
    const querySnapshot = await getDocs(collection(db, "tournaments"));
    const data = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    setTournaments(data);
  };

  const fetchPlayers = async () => {
    const querySnapshot = await getDocs(collection(db, "players"));
    const playerData = {};
    querySnapshot.forEach(docSnap => {
      playerData[docSnap.id] = docSnap.data();
    });
    setPlayers(playerData);
  };

  const handleClose = async (tournamentId) => {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);
    const tournamentData = tournamentSnap.data();

    if (tournamentData.winner) {
      const winnerRef = doc(db, "players", tournamentData.winner);
      const winnerSnap = await getDoc(winnerRef);
      if (winnerSnap.exists()) {
        const currentScore = winnerSnap.data().score || 0;
        await updateDoc(winnerRef, {
          score: currentScore + 5
        });
      }
    }

    await updateDoc(tournamentRef, { closed: true });
    fetchTournaments();
  };

  const handleReset = async (tournamentId) => {
    const tournamentRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tournamentRef, {
      winner: null,
      closed: false
    });
    fetchTournaments();
  };

  const handleDelete = async (tournamentId) => {
    await deleteDoc(doc(db, "tournaments", tournamentId));
    fetchTournaments();
  };

  const handleWinnerChange = async (tournamentId, winnerId) => {
    await updateDoc(doc(db, "tournaments", tournamentId), {
      winner: winnerId
    });
    fetchTournaments();
  };

  useEffect(() => {
    fetchTournaments();
    fetchPlayers();
  }, []);

  return (
    <div className="tournament-page">
      <h1>Tournois 🎮</h1>

      <TournamentForm onCreated={fetchTournaments} />

      <h2>Tournois en cours</h2>
      {tournaments.filter(t => !t.closed).length === 0 && <p>Aucun tournoi actif.</p>}
      {tournaments.filter(t => !t.closed).map((t) => (
        <div key={t.id} className="tournament-card">
          <h3>{t.name}</h3>
          <p>{t.isTeamBased ? 'Tournoi en équipes' : 'Tournoi 1v1'} - Format : {t.format}</p>

          <label>Vainqueur : </label>
          <select
            value={t.winner || ''}
            onChange={(e) => handleWinnerChange(t.id, e.target.value)}
          >
            <option value="">-- Sélectionner un vainqueur --</option>
            {Object.entries(players).map(([id, p]) => (
              <option key={id} value={id}>{p.name}</option>
            ))}
          </select>

          <div className="button-group">
            <button onClick={() => handleClose(t.id)}>✅ Clôturer</button>
            <button onClick={() => handleReset(t.id)}>🔄 Reset</button>
            <button onClick={() => handleDelete(t.id)}>🗑 Supprimer</button>
          </div>
        </div>
      ))}

      <h2>Tournois terminés 🏆</h2>
      {tournaments.filter(t => t.closed).length === 0 && <p>Aucun tournoi terminé.</p>}
      {tournaments.filter(t => t.closed).map((t) => (
        <div key={t.id} className="tournament-card finished">
          <h3>{t.name}</h3>
          <p>{t.isTeamBased ? 'Équipes' : '1v1'} - {t.format}</p>
          <p>Vainqueur : {t.winner ? (players[t.winner]?.name || 'Inconnu') : 'Non défini'}</p>
        </div>
      ))}
    </div>
  );
}

export default TournamentPage;
