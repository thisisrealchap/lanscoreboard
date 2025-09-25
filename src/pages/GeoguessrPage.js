import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const GeoguessrPage = () => {
  const [mode, setMode] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [winner, setWinner] = useState(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const snapshot = await getDocs(collection(db, 'players'));
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (winner && mode === '1v1') {
      import('firebase/firestore').then(({ doc, updateDoc, increment }) => {
        const winnerRef = doc(db, 'players', winner);
        updateDoc(winnerRef, { score: increment(5) });
      });
    }
    if (winner && mode === '2v2') {
      import('firebase/firestore').then(({ doc, updateDoc, increment }) => {
        const team = winner === 'team1' ? matches[0].team1 : matches[0].team2;
        team.forEach(pid => {
          const playerRef = doc(db, 'players', pid);
          updateDoc(playerRef, { score: increment(5) });
        });
      });
    }
  }, [winner, mode, matches]);

  const handleModeChange = (e) => {
    setMode(e.target.value);
    setSelectedPlayers([]);
    setTournamentStarted(false);
    setMatches([]);
    setWinner(null);
  };

  const startTournament = () => {
    const games = [
      { id: 1, player1: selectedPlayers[0], player2: selectedPlayers[1], winner: null },
      { id: 2, player1: selectedPlayers[0], player2: selectedPlayers[1], winner: null },
      { id: 3, player1: selectedPlayers[0], player2: selectedPlayers[1], winner: null }
    ];
    setMatches(games);
    setTournamentStarted(true);
    setWinner(null);
  };

  const startTournament2v2 = () => {
    const games = [
      { id: 1, team1: [selectedPlayers[0], selectedPlayers[1]], team2: [selectedPlayers[2], selectedPlayers[3]], winner: null },
      { id: 2, team1: [selectedPlayers[0], selectedPlayers[1]], team2: [selectedPlayers[2], selectedPlayers[3]], winner: null },
      { id: 3, team1: [selectedPlayers[0], selectedPlayers[1]], team2: [selectedPlayers[2], selectedPlayers[3]], winner: null }
    ];
    setMatches(games);
    setTournamentStarted(true);
    setWinner(null);
  };

  function checkWinner(updatedMatches) {
    const score = {};
    updatedMatches.forEach(m => {
      if (m.winner) {
        score[m.winner] = (score[m.winner] || 0) + 1;
      }
    });
    const winScore = 2;
    const winnerId = Object.keys(score).find(pid => score[pid] >= winScore);
    if (winnerId) setWinner(winnerId);
  }

  function checkWinner2v2(updatedMatches) {
    const score = { team1: 0, team2: 0 };
    updatedMatches.forEach(m => {
      if (m.winner === 'team1') score.team1++;
      if (m.winner === 'team2') score.team2++;
    });
    const winScore = 2;
    if (score.team1 >= winScore) setWinner('team1');
    if (score.team2 >= winScore) setWinner('team2');
  }

  return (
    <div style={{ fontFamily: "'Press Start 2P', cursive", background: '#111', color: '#0ff', minHeight: '100vh', padding: 20 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>🌍 Tournoi Geoguessr</h1>
      <div style={{ marginBottom: 30 }}>
        <label style={{ marginRight: 20 }}>Mode :</label>
        <select value={mode} onChange={handleModeChange} style={{ padding: 10, fontSize: 16 }}>
          <option value="">-- Choisir --</option>
          <option value="1v1">1 vs 1</option>
          <option value="2v2">2 vs 2</option>
        </select>
      </div>

      {/* Sélection des joueurs pour le mode 1v1 */}
      {mode === '1v1' && !tournamentStarted && (
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 10 }}>Sélectionne 2 joueurs :</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => {
                  if (selectedPlayers.includes(player.id)) {
                    setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                  } else if (selectedPlayers.length < 2) {
                    setSelectedPlayers([...selectedPlayers, player.id]);
                  }
                }}
                style={{
                  background: selectedPlayers.includes(player.id) ? '#0ff' : '#222',
                  color: selectedPlayers.includes(player.id) ? '#222' : '#0ff',
                  padding: '10px 18px',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  fontSize: 14,
                  border: '2px solid #0ff',
                  cursor: 'pointer',
                  opacity: selectedPlayers.length === 2 && !selectedPlayers.includes(player.id) ? 0.5 : 1
                }}
                disabled={selectedPlayers.length === 2 && !selectedPlayers.includes(player.id)}
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sélection des joueurs et constitution des équipes pour le mode 2v2 */}
      {mode === '2v2' && !tournamentStarted && (
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 10 }}>Sélectionne 4 joueurs :</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {players.map(player => (
              <button
                key={player.id}
                onClick={() => {
                  if (selectedPlayers.includes(player.id)) {
                    setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                  } else if (selectedPlayers.length < 4) {
                    setSelectedPlayers([...selectedPlayers, player.id]);
                  }
                }}
                style={{
                  background: selectedPlayers.includes(player.id) ? '#0ff' : '#222',
                  color: selectedPlayers.includes(player.id) ? '#222' : '#0ff',
                  padding: '10px 18px',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  fontSize: 14,
                  border: '2px solid #0ff',
                  cursor: 'pointer',
                  opacity: selectedPlayers.length === 4 && !selectedPlayers.includes(player.id) ? 0.5 : 1
                }}
                disabled={selectedPlayers.length === 4 && !selectedPlayers.includes(player.id)}
              >
                {player.name}
              </button>
            ))}
          </div>
          {selectedPlayers.length === 4 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ color: '#ff0', marginBottom: 10 }}>Constitution des équipes :</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
                <div style={{ background: '#222', border: '2px solid #0ff', borderRadius: 8, padding: 16, minWidth: 120 }}>
                  <strong style={{ color: '#0ff' }}>Équipe 1</strong>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    <li>{players.find(p => p.id === selectedPlayers[0])?.name}</li>
                    <li>{players.find(p => p.id === selectedPlayers[1])?.name}</li>
                  </ul>
                </div>
                <div style={{ background: '#222', border: '2px solid #0ff', borderRadius: 8, padding: 16, minWidth: 120 }}>
                  <strong style={{ color: '#0ff' }}>Équipe 2</strong>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    <li>{players.find(p => p.id === selectedPlayers[2])?.name}</li>
                    <li>{players.find(p => p.id === selectedPlayers[3])?.name}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bouton pour lancer le tournoi */}
      {mode === '1v1' && selectedPlayers.length === 2 && !tournamentStarted && (
        <button onClick={startTournament} style={{ background: '#0ff', color: '#222', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', fontSize: 16 }}>
          Lancer le tournoi
        </button>
      )}
      {mode === '2v2' && selectedPlayers.length === 4 && !tournamentStarted && (
        <button onClick={startTournament2v2} style={{ background: '#0ff', color: '#222', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', fontSize: 16 }}>
          Lancer le tournoi 2v2
        </button>
      )}

      {/* Affichage du bracket 1v1 */}
      {tournamentStarted && mode === '1v1' && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Bracket 1v1 (BO3)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {matches.map((match, idx) => (
              <div key={match.id} style={{ background: '#222', border: '2px solid #0ff', borderRadius: 8, padding: 20, minWidth: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: '#ff0', fontWeight: 'bold' }}>Manche {idx + 1}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', gap: 20 }}>
                  <button
                    onClick={() => {
                      const updated = matches.map(m => m.id === match.id ? { ...m, winner: match.player1 } : m);
                      setMatches(updated);
                      checkWinner(updated);
                    }}
                    style={{
                      background: match.winner === match.player1 ? '#0f0' : '#222',
                      color: match.winner === match.player1 ? '#222' : '#0ff',
                      padding: '10px 18px',
                      borderRadius: 6,
                      fontWeight: 'bold',
                      fontSize: 16,
                      border: '2px solid #0ff',
                      cursor: 'pointer'
                    }}
                  >
                    {players.find(p => p.id === match.player1)?.name || 'Joueur 1'}
                  </button>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>VS</span>
                  <button
                    onClick={() => {
                      const updated = matches.map(m => m.id === match.id ? { ...m, winner: match.player2 } : m);
                      setMatches(updated);
                      checkWinner(updated);
                    }}
                    style={{
                      background: match.winner === match.player2 ? '#0f0' : '#222',
                      color: match.winner === match.player2 ? '#222' : '#0ff',
                      padding: '10px 18px',
                      borderRadius: 6,
                      fontWeight: 'bold',
                      fontSize: 16,
                      border: '2px solid #0ff',
                      cursor: 'pointer'
                    }}
                  >
                    {players.find(p => p.id === match.player2)?.name || 'Joueur 2'}
                  </button>
                </div>
                {match.winner && (
                  <div style={{ marginTop: 10, color: '#0f0', fontWeight: 'bold' }}>
                    Gagnant : {players.find(p => p.id === match.winner)?.name}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Affichage du vainqueur du BO3 */}
          {winner && (
            <>
              <div style={{ marginTop: 30, textAlign: 'center', color: '#ff0', fontSize: 22, fontWeight: 'bold' }}>
                🏆 Vainqueur du tournoi : {players.find(p => p.id === winner)?.name}
              </div>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setTournamentStarted(false);
                    setMatches([]);
                    setWinner(null);
                    setSelectedPlayers([]);
                  }}
                  style={{ background: '#0ff', color: '#222', padding: '10px 24px', borderRadius: 8, fontWeight: 'bold', fontSize: 18, marginTop: 10 }}
                >
                  🔁 Rejouer un tournoi 1v1
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Affichage du bracket 2v2 */}
      {tournamentStarted && mode === '2v2' && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Bracket 2v2 (BO3)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {matches.map((match, idx) => (
              <div key={match.id} style={{ background: '#222', border: '2px solid #0ff', borderRadius: 8, padding: 20, minWidth: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: '#ff0', fontWeight: 'bold' }}>Manche {idx + 1}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', gap: 20 }}>
                  <button
                    onClick={() => {
                      const updated = matches.map(m => m.id === match.id ? { ...m, winner: 'team1' } : m);
                      setMatches(updated);
                      checkWinner2v2(updated);
                    }}
                    style={{
                      background: match.winner === 'team1' ? '#0f0' : '#222',
                      color: match.winner === 'team1' ? '#222' : '#0ff',
                      padding: '10px 18px',
                      borderRadius: 6,
                      fontWeight: 'bold',
                      fontSize: 16,
                      border: '2px solid #0ff',
                      cursor: 'pointer'
                    }}
                  >
                    {match.team1.map(pid => players.find(p => p.id === pid)?.name).join(' & ')}
                  </button>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>VS</span>
                  <button
                    onClick={() => {
                      const updated = matches.map(m => m.id === match.id ? { ...m, winner: 'team2' } : m);
                      setMatches(updated);
                      checkWinner2v2(updated);
                    }}
                    style={{
                      background: match.winner === 'team2' ? '#0f0' : '#222',
                      color: match.winner === 'team2' ? '#222' : '#0ff',
                      padding: '10px 18px',
                      borderRadius: 6,
                      fontWeight: 'bold',
                      fontSize: 16,
                      border: '2px solid #0ff',
                      cursor: 'pointer'
                    }}
                  >
                    {match.team2.map(pid => players.find(p => p.id === pid)?.name).join(' & ')}
                  </button>
                </div>
                {match.winner && (
                  <div style={{ marginTop: 10, color: '#0f0', fontWeight: 'bold' }}>
                    Gagnant : {match.winner === 'team1'
                      ? match.team1.map(pid => players.find(p => p.id === pid)?.name).join(' & ')
                      : match.team2.map(pid => players.find(p => p.id === pid)?.name).join(' & ')}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Affichage du vainqueur du BO3 */}
          {winner && (
            <>
              <div style={{ marginTop: 30, textAlign: 'center', color: '#ff0', fontSize: 22, fontWeight: 'bold' }}>
                🏆 Équipe gagnante : {winner === 'team1'
                  ? matches[0].team1.map(pid => players.find(p => p.id === pid)?.name).join(' & ')
                  : matches[0].team2.map(pid => players.find(p => p.id === pid)?.name).join(' & ')}
              </div>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setTournamentStarted(false);
                    setMatches([]);
                    setWinner(null);
                    setSelectedPlayers([]);
                  }}
                  style={{ background: '#0ff', color: '#222', padding: '10px 24px', borderRadius: 8, fontWeight: 'bold', fontSize: 18, marginTop: 10 }}
                >
                  🔁 Rejouer un tournoi 2v2
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GeoguessrPage;