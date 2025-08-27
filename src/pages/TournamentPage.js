import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TournamentPage = () => {
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentMode, setTournamentMode] = useState('simple'); // simple, bo3, bo5

  // Récupération des joueurs depuis Firebase
  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, "players"));
      const playersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayers(playersList);
    };
    fetchPlayers();
  }, []);

  // Écoute en temps réel des tournois
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tournaments"), (snapshot) => {
      const tournamentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTournaments(tournamentsList);
    });
    return () => unsubscribe();
  }, []);

  // Génération des matchs pour un tournoi simple (élimination directe)
  const generateSimpleTournament = (participantIds) => {
    const matches = [];
    const shuffled = [...participantIds].sort(() => Math.random() - 0.5);
    
    // Créer les matchs du premier round
    let currentRound = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        currentRound.push({
          player1: shuffled[i],
          player2: shuffled[i + 1],
          winner: null,
          round: 1
        });
      }
      // Pas de match bye, on gérera le joueur restant après
    }
    
    matches.push(...currentRound);
    
    // Si nombre impair de joueurs, créer un match supplémentaire avec le joueur restant
    if (shuffled.length % 2 === 1) {
      const lastPlayer = shuffled[shuffled.length - 1];
      // Ce joueur affrontera un perdant aléatoire du premier round
      matches.push({
        player1: lastPlayer,
        player2: null, // Sera assigné après le premier round
        winner: null,
        round: 1,
        waitingForLosers: true,
        allParticipants: shuffled
      });
    }
    
    // Générer les tours suivants (structure vide)
    let roundNumber = 2;
    let playersInRound = Math.ceil(shuffled.length / 2);
    
    while (playersInRound > 1) {
      const roundMatches = [];
      for (let i = 0; i < Math.floor(playersInRound / 2); i++) {
        roundMatches.push({
          player1: null,
          player2: null,
          winner: null,
          round: roundNumber,
          allParticipants: shuffled
        });
      }
      
      if (playersInRound % 2 === 1) {
        roundMatches.push({
          player1: null,
          player2: null,
          winner: null,
          round: roundNumber,
          waitingForLosers: true,
          allParticipants: shuffled
        });
      }
      
      matches.push(...roundMatches);
      playersInRound = Math.ceil(playersInRound / 2);
      roundNumber++;
    }
    
    return matches;
  };

  // Génération d'un duel BO3/BO5
  const generateDuel = (participantIds, mode) => {
    if (participantIds.length !== 2) {
      throw new Error("Un duel nécessite exactement 2 joueurs");
    }
    
    const rounds = mode === 'bo3' ? 3 : 5;
    const matches = [];
    
    for (let i = 1; i <= rounds; i++) {
      matches.push({
        player1: participantIds[0],
        player2: participantIds[1],
        winner: null,
        round: i,
        isDuel: true,
        gameNumber: i
      });
    }
    
    return matches;
  };

  // Création d'un tournoi
  const createTournament = async () => {
    if (!tournamentName.trim() || selectedPlayers.length < 2) {
      alert('Veuillez renseigner un nom et sélectionner au moins 2 joueurs');
      return;
    }

    if (tournamentMode !== 'simple' && selectedPlayers.length !== 2) {
      alert('Les duels BO3/BO5 nécessitent exactement 2 joueurs');
      return;
    }

    try {
      let matches;
      if (tournamentMode === 'simple') {
        matches = generateSimpleTournament(selectedPlayers);
      } else {
        matches = generateDuel(selectedPlayers, tournamentMode);
      }

      await addDoc(collection(db, "tournaments"), {
        name: tournamentName,
        mode: tournamentMode,
        participants: selectedPlayers,
        matches: matches,
        status: 'active',
        winner: null,
        createdAt: new Date()
      });

      // Reset du formulaire
      setTournamentName('');
      setSelectedPlayers([]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Erreur lors de la création du tournoi:', error);
      alert('Erreur lors de la création du tournoi');
    }
  };

  // Gestion de la sélection des joueurs
  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Sélection/désélection de tous les joueurs
  const toggleAllPlayers = () => {
    if (selectedPlayers.length === players.length) {
      // Si tous sont sélectionnés, désélectionner tous
      setSelectedPlayers([]);
    } else {
      // Sinon, sélectionner tous les joueurs
      setSelectedPlayers(players.map(player => player.id));
    }
  };

  // Définir le gagnant d'un match
  const setMatchWinner = async (tournamentId, matchIndex, winnerId) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const updatedMatches = [...tournament.matches];
    updatedMatches[matchIndex].winner = winnerId;

    // Attribution des points selon le mode
    let points = 0;
    let tournamentWinner = null;

    if (tournament.mode === 'simple') {
      points = 3;
      
      // Avancer les gagnants vers le prochain tour
      const currentMatch = updatedMatches[matchIndex];
      const currentRound = currentMatch.round;
      
      // Vérifier si tous les matchs du round actuel sont terminés
      const currentRoundMatches = updatedMatches.filter(m => m.round === currentRound);
      const completedMatches = currentRoundMatches.filter(m => m.winner && !m.waitingForLosers);
      const waitingForLosersMatches = currentRoundMatches.filter(m => m.waitingForLosers && !m.winner);
      
      // Si on a des matchs en attente de perdants, les assigner
      if (waitingForLosersMatches.length > 0 && completedMatches.length > 0) {
        waitingForLosersMatches.forEach(waitingMatch => {
          const waitingMatchIndex = updatedMatches.findIndex(m => m === waitingMatch);
          if (!waitingMatch.player2) {
            // Récupérer tous les perdants du round actuel
            const losers = completedMatches.map(m => 
              m.winner === m.player1 ? m.player2 : m.player1
            ).filter(Boolean);
            
            if (losers.length > 0) {
              // Choisir un perdant aléatoire
              const randomLoser = losers[Math.floor(Math.random() * losers.length)];
              updatedMatches[waitingMatchIndex].player2 = randomLoser;
            }
          }
        });
      }
      
      // Vérifier si tous les matchs du round sont maintenant terminés
      const allCurrentRoundComplete = updatedMatches.filter(m => m.round === currentRound).every(m => m.winner);
      
      if (allCurrentRoundComplete) {
        // Récupérer tous les gagnants du round actuel
        const winners = currentRoundMatches.filter(m => m.winner).map(m => m.winner);
        
        // Mettre à jour les matchs du prochain round
        const nextRound = currentRound + 1;
        const nextRoundMatches = updatedMatches.filter(m => m.round === nextRound);
        
        if (nextRoundMatches.length > 0) {
          let winnerIndex = 0;
          for (let i = 0; i < nextRoundMatches.length; i++) {
            const match = nextRoundMatches[i];
            const matchIndex = updatedMatches.findIndex(m => m === match);
            
            if (match.waitingForLosers) {
              // Pour les matchs en attente de perdants
              if (winnerIndex < winners.length) {
                updatedMatches[matchIndex].player1 = winners[winnerIndex];
                winnerIndex++;
              }
              // Le player2 sera un perdant du prochain round
            } else {
              // Matchs normaux
              if (winnerIndex < winners.length) {
                updatedMatches[matchIndex].player1 = winners[winnerIndex];
                winnerIndex++;
              }
              if (winnerIndex < winners.length) {
                updatedMatches[matchIndex].player2 = winners[winnerIndex];
                winnerIndex++;
              }
            }
          }
        }
      }
      
      // Vérifier si c'est la finale
      const finalRound = Math.max(...updatedMatches.map(m => m.round));
      const finalMatch = updatedMatches.find(m => m.round === finalRound);
      if (finalMatch && finalMatch.winner) {
        tournamentWinner = finalMatch.winner;
        // Bonus de 10 points pour le gagnant du tournoi
        const winnerRef = doc(db, 'players', tournamentWinner);
        const winner = players.find(p => p.id === tournamentWinner);
        if (winner) {
          await updateDoc(winnerRef, {
            score: (winner.score || 0) + 10
          });
        }
      }
    } else if (tournament.mode === 'bo3' || tournament.mode === 'bo5') {
      // Pour les duels, vérifier qui a gagné le plus de rounds
      const player1Wins = updatedMatches.filter(m => m.winner === updatedMatches[0].player1).length;
      const player2Wins = updatedMatches.filter(m => m.winner === updatedMatches[0].player2).length;
      const totalRounds = tournament.mode === 'bo3' ? 3 : 5;
      const winsNeeded = Math.ceil(totalRounds / 2);
      
      if (player1Wins >= winsNeeded) {
        tournamentWinner = updatedMatches[0].player1;
        points = 5;
      } else if (player2Wins >= winsNeeded) {
        tournamentWinner = updatedMatches[0].player2;
        points = 5;
      }
    }

    // Mettre à jour le score du joueur du match actuel
    if (points > 0) {
      const playerRef = doc(db, 'players', winnerId);
      const player = players.find(p => p.id === winnerId);
      if (player) {
        await updateDoc(playerRef, {
          score: (player.score || 0) + points
        });
      }
    }

    // Mettre à jour le tournoi
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      matches: updatedMatches,
      winner: tournamentWinner,
      status: tournamentWinner ? 'completed' : 'active'
    });
  };

  // Supprimer un tournoi
  const deleteTournament = async (tournamentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
      await deleteDoc(doc(db, 'tournaments', tournamentId));
    }
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Joueur inconnu';
  };

  const getModeLabel = (mode) => {
    switch(mode) {
      case 'simple': return 'Tournoi Simple';
      case 'bo3': return 'Duel BO3';
      case 'bo5': return 'Duel BO5';
      default: return mode;
    }
  };

  return (
    <div style={{
      fontFamily: "'Press Start 2P', cursive",
      backgroundColor: '#111',
      color: '#0ff',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🏆 Gestion des Tournois 🏆
      </h1>

      {/* Bouton créer tournoi */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            backgroundColor: '#0f0',
            color: '#000',
            border: 'none',
            padding: '15px 30px',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '5px'
          }}
        >
          + Créer un Tournoi
        </button>
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#222',
            border: '2px solid #0ff',
            padding: '30px',
            borderRadius: '10px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>Nouveau Tournoi</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Nom du tournoi :</label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  color: '#0ff',
                  border: '1px solid #0ff',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '12px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>Mode de jeu :</label>
              <select
                value={tournamentMode}
                onChange={(e) => setTournamentMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#000',
                  color: '#0ff',
                  border: '1px solid #0ff',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '12px'
                }}
              >
                <option value="simple">Tournoi Simple (3pts/match, 10pts/victoire)</option>
                <option value="bo3">Duel BO3 (5pts/victoire)</option>
                <option value="bo5">Duel BO5 (5pts/victoire)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label>
                  Joueurs participants ({selectedPlayers.length} sélectionnés) :
                </label>
                <button
                  type="button"
                  onClick={toggleAllPlayers}
                  style={{
                    backgroundColor: selectedPlayers.length === players.length ? '#f90' : '#0f0',
                    color: '#000',
                    border: 'none',
                    padding: '5px 15px',
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '10px',
                    cursor: 'pointer',
                    borderRadius: '3px'
                  }}
                >
                  {selectedPlayers.length === players.length ? 'Désélectionner tous' : 'Sélectionner tous'}
                </button>
              </div>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                border: '1px solid #0ff',
                padding: '10px',
                backgroundColor: '#000'
              }}>
                {players.map(player => (
                  <div
                    key={player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      padding: '5px',
                      backgroundColor: selectedPlayers.includes(player.id) ? '#0ff3' : 'transparent'
                    }}
                    onClick={() => togglePlayerSelection(player.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      readOnly
                      style={{ marginRight: '10px' }}
                    />
                    <span>{player.name} (Score: {player.score || 0})</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  backgroundColor: '#f00',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={createTournament}
                style={{
                  backgroundColor: '#0f0',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des tournois */}
      <div>
        <h2>Tournois Actifs</h2>
        {tournaments.filter(t => t.status === 'active').length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Aucun tournoi actif</p>
        ) : (
          tournaments.filter(t => t.status === 'active').map(tournament => (
            <div
              key={tournament.id}
              style={{
                backgroundColor: '#222',
                border: '2px solid #0f0',
                margin: '20px 0',
                padding: '20px',
                borderRadius: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>{tournament.name}</h3>
                <div>
                  <span style={{ marginRight: '15px' }}>{getModeLabel(tournament.mode)}</span>
                  <button
                    onClick={() => deleteTournament(tournament.id)}
                    style={{
                      backgroundColor: '#f00',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>

              <div>
                <h4>Matchs :</h4>
                {tournament.mode === 'simple' ? (
                  // Affichage pour tournoi simple par rounds
                  Array.from(new Set(tournament.matches.map(m => m.round))).sort().map(roundNumber => (
                    <div key={roundNumber} style={{ marginBottom: '20px' }}>
                      <h5 style={{ color: '#ff0', marginBottom: '10px' }}>
                        Round {roundNumber} {roundNumber === Math.max(...tournament.matches.map(m => m.round)) ? '(Finale)' : ''}
                      </h5>
                      {tournament.matches.filter(m => m.round === roundNumber).map((match, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: '#333',
                            padding: '10px',
                            margin: '5px 0',
                            borderRadius: '5px',
                            border: match.winner ? '2px solid #0f0' : '2px solid #666'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              {match.bye ? (
                                <span style={{ color: '#ff0' }}>
                                  {getPlayerName(match.player1)} (Exempt)
                                </span>
                              ) : match.waitingForLosers && !match.player2 ? (
                                <span style={{ color: '#ff0' }}>
                                  {getPlayerName(match.player1)} - Choisir adversaire ci-dessous
                                </span>
                              ) : (
                                <>
                                  {match.player1 && (
                                    <span style={{ color: match.winner === match.player1 ? '#0f0' : '#fff' }}>
                                      {getPlayerName(match.player1)}
                                    </span>
                                  )}
                                  {match.player1 && match.player2 && <span style={{ margin: '0 10px' }}>VS</span>}
                                  {match.player2 && (
                                    <span style={{ color: match.winner === match.player2 ? '#0f0' : '#fff' }}>
                                      {getPlayerName(match.player2)}
                                    </span>
                                  )}
                                  {!match.player1 || !match.player2 ? (
                                    <span style={{ color: '#888' }}>En attente...</span>
                                  ) : null}
                                </>
                              )}
                            </div>
                            
                            {!match.winner && match.player1 && (match.player2 || match.waitingForLosers) && !match.bye && (
                              <div>
                                {match.waitingForLosers && !match.player2 ? (
                                  // Si on attend un perdant, permettre de choisir parmi les perdants disponibles
                                  <>
                                    <select
                                      onChange={(e) => {
                                        const selectedLoser = e.target.value;
                                        if (selectedLoser) {
                                          // Assigner le perdant sélectionné et permettre le match
                                          const tournamentIndex = tournaments.findIndex(t => t.id === tournament.id);
                                          const updatedTournament = { ...tournaments[tournamentIndex] };
                                          const updatedMatches = [...updatedTournament.matches];
                                          const currentMatchIndex = updatedMatches.findIndex(m => m === match);
                                          updatedMatches[currentMatchIndex].player2 = selectedLoser;
                                          
                                          // Mettre à jour localement pour permettre les boutons
                                          setTournaments(prev => prev.map(t => 
                                            t.id === tournament.id 
                                              ? { ...t, matches: updatedMatches }
                                              : t
                                          ));
                                        }
                                      }}
                                      style={{
                                        backgroundColor: '#000',
                                        color: '#0ff',
                                        border: '1px solid #0ff',
                                        padding: '5px',
                                        fontSize: '10px',
                                        marginBottom: '10px'
                                      }}
                                    >
                                      <option value="">Choisir l'adversaire</option>
                                      {/* Récupérer les perdants du round actuel */}
                                      {tournament.matches
                                        .filter(m => m.round === match.round && m.winner && m !== match)
                                        .map(m => m.winner === m.player1 ? m.player2 : m.player1)
                                        .filter(Boolean)
                                        .map(loserId => (
                                          <option key={loserId} value={loserId}>
                                            {getPlayerName(loserId)}
                                          </option>
                                        ))
                                      }
                                    </select>
                                    <br />
                                  </>
                                ) : null}
                                
                                {match.player2 && (
                                  <>
                                    <button
                                      onClick={() => setMatchWinner(tournament.id, tournament.matches.findIndex(m => m === match), match.player1)}
                                      style={{
                                        backgroundColor: '#0f0',
                                        color: '#000',
                                        border: 'none',
                                        padding: '5px 10px',
                                        margin: '0 5px',
                                        fontSize: '10px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {getPlayerName(match.player1)} gagne
                                    </button>
                                    <button
                                      onClick={() => setMatchWinner(tournament.id, tournament.matches.findIndex(m => m === match), match.player2)}
                                      style={{
                                        backgroundColor: '#0f0',
                                        color: '#000',
                                        border: 'none',
                                        padding: '5px 10px',
                                        margin: '0 5px',
                                        fontSize: '10px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {getPlayerName(match.player2)} gagne
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {match.winner && (
                              <div style={{ color: '#0f0' }}>
                                ✅ Gagnant: {getPlayerName(match.winner)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  // Affichage pour duels BO3/BO5
                  <div>
                    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ color: '#ff0' }}>
                        {getPlayerName(tournament.matches[0]?.player1)} VS {getPlayerName(tournament.matches[0]?.player2)}
                      </h5>
                      <div style={{ fontSize: '12px', color: '#0ff' }}>
                        Score: {tournament.matches.filter(m => m.winner === tournament.matches[0]?.player1).length} - {tournament.matches.filter(m => m.winner === tournament.matches[0]?.player2).length}
                      </div>
                    </div>
                    {tournament.matches.map((match, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: '#333',
                          padding: '10px',
                          margin: '5px 0',
                          borderRadius: '5px',
                          border: match.winner ? '2px solid #0f0' : '2px solid #666'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <strong>Game {match.gameNumber}</strong>
                          </div>
                          
                          {!match.winner ? (
                            <div>
                              <button
                                onClick={() => setMatchWinner(tournament.id, index, match.player1)}
                                style={{
                                  backgroundColor: '#0f0',
                                  color: '#000',
                                  border: 'none',
                                  padding: '5px 10px',
                                  margin: '0 5px',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                              >
                                {getPlayerName(match.player1)} gagne
                              </button>
                              <button
                                onClick={() => setMatchWinner(tournament.id, index, match.player2)}
                                style={{
                                  backgroundColor: '#0f0',
                                  color: '#000',
                                  border: 'none',
                                  padding: '5px 10px',
                                  margin: '0 5px',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                              >
                                {getPlayerName(match.player2)} gagne
                              </button>
                            </div>
                          ) : (
                            <div style={{ color: '#0f0' }}>
                              ✅ Gagnant: {getPlayerName(match.winner)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <h2>Tournois Terminés</h2>
        {tournaments.filter(t => t.status === 'completed').length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Aucun tournoi terminé</p>
        ) : (
          tournaments.filter(t => t.status === 'completed').map(tournament => (
            <div
              key={tournament.id}
              style={{
                backgroundColor: '#1a2a1a',
                border: '2px solid #090',
                margin: '20px 0',
                padding: '20px',
                borderRadius: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{tournament.name}</h3>
                <div>
                  <span style={{ marginRight: '15px' }}>{getModeLabel(tournament.mode)}</span>
                  <button
                    onClick={() => deleteTournament(tournament.id)}
                    style={{
                      backgroundColor: '#f00',
                      color: '#fff',
                      border: 'none',
                      padding: '5px 10px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
              {tournament.winner && (
                <div style={{ color: '#ff0', marginTop: '10px', fontSize: '14px' }}>
                  🏆 Vainqueur: {getPlayerName(tournament.winner)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TournamentPage;