import React from 'react';

export default function SoloLoserSelect({ match, tournament, tournaments, setTournaments, getPlayerName }) {
  // Trouver les perdants du round en cours
  const currentRound = match.round;
  const currentMatches = tournament.matches.filter(m => m.round === currentRound && m.winner);
  const losers = currentMatches
    .map(m => {
      if (m.player1 && m.player2 && m.winner) {
        return m.winner === m.player1 ? m.player2 : m.player1;
      }
      return null;
    })
    .filter(Boolean);

  const handleSelect = (loserId) => {
    // Mettre à jour le match pour assigner le perdant comme adversaire
    const updatedTournaments = tournaments.map(t => {
      if (t.id !== tournament.id) return t;
      const updatedMatches = t.matches.map(m => {
        if (m === match) {
          return { ...m, player2: loserId, waitingForLosers: false };
        }
        return m;
      });
      return { ...t, matches: updatedMatches };
    });
    setTournaments(updatedTournaments);
  };

  if (losers.length === 0) {
    return <div style={{ color: '#888' }}>Aucun perdant disponible</div>;
  }

  return (
    <div style={{ marginTop: 8 }}>
      <span style={{ color: '#ff0', marginRight: 8 }}>Sélectionner un perdant :</span>
      {losers.map(loserId => (
        <button
          key={loserId}
          onClick={() => handleSelect(loserId)}
          style={{
            backgroundColor: '#f90',
            color: '#000',
            border: 'none',
            padding: '3px 8px',
            margin: '0 4px',
            fontSize: '10px',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          {getPlayerName(loserId)}
        </button>
      ))}
    </div>
  );
}
