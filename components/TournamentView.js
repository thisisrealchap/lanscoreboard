import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TournamentView = ({ tournamentId }) => {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'tournaments', tournamentId), (snapshot) => {
      setTournament({ id: snapshot.id, ...snapshot.data() });
    });

    return () => unsub();
  }, [tournamentId]);

  useEffect(() => {
    const fetchMatches = async () => {
      const matchSnapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'matches'));
      const matchList = [];
      matchSnapshot.forEach(doc => matchList.push({ id: doc.id, ...doc.data() }));
      setMatches(matchList);
    };

    const fetchPlayers = async () => {
      const playerSnapshot = await getDocs(collection(db, 'players'));
      const playerMap = {};
      playerSnapshot.forEach(doc => playerMap[doc.id] = doc.data().name);
      setPlayers(playerMap);
    };

    fetchMatches();
    fetchPlayers();
  }, [tournamentId]);

  const handleWinnerSelect = async (matchId, winnerId) => {
    await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), {
      winnerId
    });

    // Recharger les matchs pour voir s'ils sont tous terminés
    const matchSnapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'matches'));
    const matchList = [];
    matchSnapshot.forEach(doc => matchList.push(doc.data()));
    const allDecided = matchList.every(m => m.winnerId);

    if (allDecided) {
      // Trouver le gagnant du dernier match (le match final)
      const finalMatch = matchList[matchList.length - 1];
      const grandWinnerId = finalMatch.winnerId;

      // Ajouter 5 points au joueur
      const winnerRef = doc(db, 'players', grandWinnerId);
      const winnerSnap = await getDoc(winnerRef);
      if (winnerSnap.exists()) {
        const currentScore = winnerSnap.data().score || 0;
        await updateDoc(winnerRef, { score: currentScore + 5 });
      }

      // Marquer le tournoi comme terminé
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        winner: grandWinnerId
      });
    }
  };

  if (!tournament) return <p>Chargement du tournoi...</p>;

  return (
    <div className="tournament-view">
      <h2>{tournament.name} 🎮</h2>
      {matches.map((match, index) => (
        <div key={match.id} className="match-card">
          <h4>Match {index + 1}</h4>
          <p>{players[match.player1Id] || '❓'} vs {players[match.player2Id] || '❓'}</p>

          {match.winnerId ? (
            <p>✅ Vainqueur : {players[match.winnerId]}</p>
          ) : (
            <select onChange={(e) => handleWinnerSelect(match.id, e.target.value)} defaultValue="">
              <option value="" disabled>Choisir le gagnant</option>
              <option value={match.player1Id}>{players[match.player1Id]}</option>
              <option value={match.player2Id}>{players[match.player2Id]}</option>
            </select>
          )}
        </div>
      ))}

      {tournament.winner && (
        <div className="winner-announcement">
          🏆 Le gagnant du tournoi est : <strong>{players[tournament.winner]}</strong>
        </div>
      )}
    </div>
  );
};

export default TournamentView;
