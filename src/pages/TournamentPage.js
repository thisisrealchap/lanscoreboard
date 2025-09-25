import { collection, getDocs, addDoc, doc, updateDoc, onSnapshot, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

import React, { useState, useEffect } from 'react';

import TeamLoserSelect from './TeamLoserSelect';
import SoloLoserSelect from './SoloLoserSelect';



// Composant utilitaire pour afficher un round de matchs (mode simple ou team)
const MatchRound = ({
  matches,
  roundNumber,
  isFinal,
  getPlayerName,
  getTeamLabel,
  setMatchWinner,
  tournament,
  tournaments,
  setTournaments,
  mode
}) => (
  <div key={roundNumber} style={{ marginBottom: '20px' }}>
    <h5 style={{ color: '#ff0', marginBottom: '10px' }}>
      Round {roundNumber} {isFinal ? '(Finale)' : ''}
    </h5>
    {matches.map((match, index) => (
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
            {mode === 'team' ? (
              match.waitingForLosers && match.team1 && !match.team2 &&
                tournament.matches.filter(m => m.round === match.round && m.winner && m !== match).length > 0 ? (
                  <>
                    <span style={{ color: '#ff0' }}>
                      {getTeamLabel(match.team1)} - Choisir adversaire ci-dessous
                    </span>
                    <TeamLoserSelect
                      match={match}
                      tournament={tournament}
                      tournaments={tournaments}
                      setTournaments={setTournaments}
                      getPlayerName={getPlayerName}
                    />
                  </>
                ) : (
                  <>
                    {match.team1 && (
                      <span style={{ color: match.winner && match.winner.name === match.team1.name ? '#0f0' : '#fff' }}>
                        {getTeamLabel(match.team1)}
                      </span>
                    )}
                    {match.team1 && match.team2 && <span style={{ margin: '0 10px' }}>VS</span>}
                    {match.team2 && (
                      <span style={{ color: match.winner && match.winner.name === match.team2.name ? '#0f0' : '#fff' }}>
                        {getTeamLabel(match.team2)}
                      </span>
                    )}
                    {!match.team1 || !match.team2 ? (
                      <span style={{ color: '#888' }}>En attente...</span>
                    ) : null}
                  </>
                )
            ) : (
              match.bye ? (
                <span style={{ color: '#ff0' }}>
                  {getPlayerName(match.player1)} (Exempt)
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
                  {/* Ajout sélection perdant pour solo */}
                  {!match.player1 || !match.player2 ? (
                    match.waitingForLosers && match.player1 && !match.player2 &&
                    tournament.matches.filter(m => m.round === match.round && m.winner && m !== match).length > 0 ? (
                      <SoloLoserSelect
                        match={match}
                        tournament={tournament}
                        tournaments={tournaments}
                        setTournaments={setTournaments}
                        getPlayerName={getPlayerName}
                      />
                    ) : (
                      <span style={{ color: '#888' }}>En attente...</span>
                    )
                  ) : null}
                </>
              )
            )}
          </div>
          {!match.winner && (
            mode === 'team'
              ? (match.team1 && match.team2 && Array.isArray(match.team1.players) && match.team1.players.length > 0 && Array.isArray(match.team2.players) && match.team2.players.length > 0 && (
                  <div>
                    <button
                      onClick={() => setMatchWinner(
                        tournament.id,
                        tournament.matches.findIndex(m => m === match),
                        match.team1,
                        true
                      )}
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
                      {getTeamLabel(match.team1)} gagne
                    </button>
                    <button
                      onClick={() => setMatchWinner(
                        tournament.id,
                        tournament.matches.findIndex(m => m === match),
                        match.team2,
                        true
                      )}
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
                      {getTeamLabel(match.team2)} gagne
                    </button>
                  </div>
                ))
              : (match.player1 && match.player2 && (
                  <div>
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
                  </div>
                ))
          )}
          {match.winner && (
            <div style={{ color: '#0f0' }}>
              ✅ Gagnant: {mode === 'team' ? match.winner.name : getPlayerName(match.winner)}
              <span style={{ color: '#ff0', marginLeft: 10 }}>
                [points: {String(match.points)}]
              </span>
              {typeof match.points === 'number' && match.points > 0 && (
                <span style={{ color: '#ff0', marginLeft: 10 }}>
                  (+{match.points} pts)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);



const TournamentPage = () => {
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentMode, setTournamentMode] = useState('simple'); // simple, bo3, bo5, team
  // Pour le mode équipe
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState([]); // [{name, players: [id]}]
  // Pour la fonctionnalité "rejouer"


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
    let currentRound = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        currentRound.push({
          player1: shuffled[i],
          player2: shuffled[i + 1],
          winner: null,
          round: 1,
          points: null // points attribués à ce match
        });
      }
    }
    matches.push(...currentRound);
    if (shuffled.length % 2 === 1) {
      const lastPlayer = shuffled[shuffled.length - 1];
      matches.push({
        player1: lastPlayer,
        player2: null,
        winner: null,
        round: 1,
        waitingForLosers: true,
        allParticipants: shuffled,
        points: null
      });
    }
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
          allParticipants: shuffled,
          points: null
        });
      }
      if (playersInRound % 2 === 1) {
        roundMatches.push({
          player1: null,
          player2: null,
          winner: null,
          round: roundNumber,
          waitingForLosers: true,
          allParticipants: shuffled,
          points: null
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
        gameNumber: i,
        points: null
      });
    }
    return matches;
  };

  // Génération d'un tournoi par équipe (élimination directe, pas d'exempt)
  // Génération d'un tournoi par équipe (aucune équipe n'est exemptée, match "en attente de perdant" si impair)
  const generateTeamTournament = (teams) => {
    // teams: [{name, players: [id]}]
    const matches = [];
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    // Premier round
    let currentRound = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        currentRound.push({
          team1: shuffled[i],
          team2: shuffled[i + 1],
          winner: null,
          round: 1,
          points: null
        });
      }
    }
    matches.push(...currentRound);
    // Si nombre impair d'équipes, la dernière équipe affronte un perdant du round 1
    if (shuffled.length % 2 === 1) {
      const lastTeam = shuffled[shuffled.length - 1];
      matches.push({
        team1: lastTeam,
        team2: null, // sera assigné après le round
        winner: null,
        round: 1,
        waitingForLosers: true,
        allParticipants: shuffled,
        points: null
      });
    }
    // Rounds suivants
    let roundNumber = 2;
    let teamsInRound = Math.ceil(shuffled.length / 2);
    while (teamsInRound > 1) {
      const roundMatches = [];
      for (let i = 0; i < Math.floor(teamsInRound / 2); i++) {
        roundMatches.push({
          team1: null,
          team2: null,
          winner: null,
          round: roundNumber,
          allParticipants: shuffled,
          points: null
        });
      }
      if (teamsInRound % 2 === 1) {
        roundMatches.push({
          team1: null,
          team2: null,
          winner: null,
          round: roundNumber,
          waitingForLosers: true,
          allParticipants: shuffled,
          points: null
        });
      }
      matches.push(...roundMatches);
      teamsInRound = Math.ceil(teamsInRound / 2);
      roundNumber++;
    }
    return matches;
  };

  // Création d'un tournoi
  const createTournament = async () => {
    if (!tournamentName.trim()) {
      alert('Veuillez renseigner un nom');
      return;
    }
    if (tournamentMode === 'team') {
      // Validation équipes
      if (teams.length < 2) {
        alert('Veuillez créer au moins 2 équipes');
        return;
      }
      for (let i = 0; i < teams.length; i++) {
        if (!teams[i].name.trim() || teams[i].players.length < 1) {
          alert('Chaque équipe doit avoir un nom et au moins 1 joueur');
          return;
        }
      }
      // Vérifier que chaque joueur n'est que dans une seule équipe
      const allPlayers = teams.flatMap(t => t.players);
      if (new Set(allPlayers).size !== allPlayers.length) {
        alert('Un joueur ne peut être que dans une seule équipe');
        return;
      }
      try {
        const matches = generateTeamTournament(teams);
        await addDoc(collection(db, "tournaments"), {
          name: tournamentName,
          mode: tournamentMode,
          teams: teams,
          matches: matches,
          status: 'active',
          winner: null,
          createdAt: new Date()
        });
        setTournamentName('');
        setTeams([]);
        setTeamCount(2);
        setShowCreateModal(false);
      } catch (error) {
        console.error('Erreur lors de la création du tournoi:', error);
        alert('Erreur lors de la création du tournoi');
      }
      return;
    }
    // Modes solo
    if (selectedPlayers.length < 2) {
      alert('Veuillez sélectionner au moins 2 joueurs');
      return;
    }
    if (tournamentMode !== 'simple' && tournamentMode !== 'team' && selectedPlayers.length !== 2) {
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
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(players.map(player => player.id));
    }
  };

  // Gestion des équipes (ajout, suppression, modification)
  const handleTeamNameChange = (idx, name) => {
    setTeams(prev => prev.map((t, i) => i === idx ? { ...t, name } : t));
  };
  const handleTeamPlayerToggle = (teamIdx, playerId) => {
    setTeams(prev => prev.map((t, i) => {
      if (i !== teamIdx) return t;
      return {
        ...t,
        players: t.players.includes(playerId)
          ? t.players.filter(id => id !== playerId)
          : [...t.players, playerId]
      };
    }));
  };
  const handleTeamCountChange = (count) => {
    setTeamCount(count);
    setTeams(prev => {
      const arr = [...prev];
      while (arr.length < count) arr.push({ name: `Équipe ${arr.length + 1}`, players: [] });
      while (arr.length > count) arr.pop();
      return arr;
    });
  };

  // Définir le gagnant d'un match
  const setMatchWinner = async (tournamentId, matchIndex, winnerId, isTeam = false) => {
    // --- LOGIQUE ROBUSTE ET COMMENTÉE ---
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    const updatedMatches = [...tournament.matches];
    if (updatedMatches[matchIndex].pointsGiven) return;
    updatedMatches[matchIndex].winner = winnerId;
    updatedMatches[matchIndex].pointsGiven = true;
    // Détermination du nombre de points à attribuer pour ce match
    let points = 0;
    if (tournament.mode === 'simple' || tournament.mode === 'team') {
      points = 3;
    } else if (tournament.mode === 'bo3' || tournament.mode === 'bo5') {
      // Pour les duels, 5 points par match gagné
      const player1 = updatedMatches[0].player1;
      const player2 = updatedMatches[0].player2;
      const player1Wins = updatedMatches.filter(m => m.winner === player1).length;
      const player2Wins = updatedMatches.filter(m => m.winner === player2).length;
      const totalRounds = tournament.mode === 'bo3' ? 3 : 5;
      const winsNeeded = Math.ceil(totalRounds / 2);
      if ((player1Wins >= winsNeeded && winnerId === player1) || (player2Wins >= winsNeeded && winnerId === player2)) {
        points = 5;
      } else {
        points = 0;
      }
    }
    updatedMatches[matchIndex].points = points;

    // Remplir automatiquement les matchs du round suivant
    if (tournament.mode === 'simple' || tournament.mode === 'team') {
      const currentMatch = updatedMatches[matchIndex];
      const currentRound = currentMatch.round;
      const nextRound = currentRound + 1;
      // Chercher le premier match du round suivant qui a une place libre
      const nextRoundMatches = updatedMatches.filter(m => m.round === nextRound);
      if (nextRoundMatches.length > 0) {
        // Trouver l'index du match dans le round suivant à remplir
        let idxToFill = -1;
        for (let i = 0; i < nextRoundMatches.length; i++) {
          const m = nextRoundMatches[i];
          if (tournament.mode === 'team') {
            if (!m.team1) { idxToFill = i; break; }
            else if (!m.team2) { idxToFill = i; break; }
          } else {
            if (!m.player1) { idxToFill = i; break; }
            else if (!m.player2) { idxToFill = i; break; }
          }
        }
        if (idxToFill !== -1) {
          const matchToFill = nextRoundMatches[idxToFill];
          const matchToFillIndex = updatedMatches.findIndex(m => m === matchToFill);
          if (tournament.mode === 'team') {
            if (!updatedMatches[matchToFillIndex].team1) updatedMatches[matchToFillIndex].team1 = currentMatch.winner;
            else if (!updatedMatches[matchToFillIndex].team2) updatedMatches[matchToFillIndex].team2 = currentMatch.winner;
          } else {
            if (!updatedMatches[matchToFillIndex].player1) updatedMatches[matchToFillIndex].player1 = currentMatch.winner;
            else if (!updatedMatches[matchToFillIndex].player2) updatedMatches[matchToFillIndex].player2 = currentMatch.winner;
          }
        }
      }
    }

    // Mise à jour du tournoi (pas d'attribution Firestore ici)
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      matches: updatedMatches
    });

    // Si le tournoi est terminé, additionner les points et les attribuer
    let isFinished = false;
    if (tournament.mode === 'simple' || tournament.mode === 'team') {
      const finalRound = Math.max(...updatedMatches.map(m => m.round));
      const finals = updatedMatches.filter(m => m.round === finalRound);
      isFinished = finals.some(m => m.winner);
    } else if (tournament.mode === 'bo3' || tournament.mode === 'bo5') {
      const player1 = updatedMatches[0].player1;
      const player2 = updatedMatches[0].player2;
      const totalRounds = tournament.mode === 'bo3' ? 3 : 5;
      const winsNeeded = Math.ceil(totalRounds / 2);
      const player1Wins = updatedMatches.filter(m => m.winner === player1).length;
      const player2Wins = updatedMatches.filter(m => m.winner === player2).length;
      isFinished = player1Wins >= winsNeeded || player2Wins >= winsNeeded;
    }

    if (isFinished) {
      if (tournament.mode === 'simple' || tournament.mode === 'bo3' || tournament.mode === 'bo5') {
        // Additionner les points pour chaque joueur
        const playerScores = {};
        updatedMatches.forEach(m => {
          if (m.winner && typeof m.winner === 'string' && typeof m.points === 'number' && m.points > 0) {
            playerScores[m.winner] = (playerScores[m.winner] || 0) + m.points;
          }
        });
        for (const playerId in playerScores) {
          const winnerRef = doc(db, 'players', playerId);
          await updateDoc(winnerRef, { score: increment(playerScores[playerId]) });
        }
      } else if (tournament.mode === 'team') {
        // Additionner les points pour chaque membre d'équipe gagnante
        const teamScores = {};
        updatedMatches.forEach(m => {
          if (
            m.winner &&
            m.winner.players &&
            Array.isArray(m.winner.players) &&
            typeof m.points === 'number' && m.points > 0
          ) {
            const uniquePlayers = Array.from(new Set(m.winner.players));
            uniquePlayers.forEach(pid => {
              teamScores[pid] = (teamScores[pid] || 0) + m.points;
            });
          }
        });
        for (const playerId in teamScores) {
          const winnerRef = doc(db, 'players', playerId);
          await updateDoc(winnerRef, { score: increment(teamScores[playerId]) });
        }
      }
    }
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
      case 'team': return 'Tournoi par Équipe';
      default: return mode;
    }
  };

  const getTeamLabel = (team) => {
    if (!team) return '';
    return `${team.name} (${team.players.map(getPlayerName).join(', ')})`;
  };

  // UI
  return (
    <div>
      {/* Bouton Geoguessr affiché une seule fois */}
      {/* ...existing code... */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <a
          href="/geoguessr"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#0ff',
            color: '#222',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            textDecoration: 'none',
            boxShadow: '0 2px 8px #0002',
            marginRight: 10
          }}
        >
          🌍 Tournois Geoguessr
        </a>
      </div>
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
                onChange={(e) => {
                  setTournamentMode(e.target.value);
                  if (e.target.value !== 'team') {
                    setTeams([]);
                  }
                }}
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
                <option value="simple">Tournoi Simple (3pts/match)</option>
                <option value="bo3">Duel BO3 (5pts/match)</option>
                <option value="bo5">Duel BO5 (5pts/match)</option>
                <option value="team">Tournoi par Équipe</option>
              </select>
            </div>

            {tournamentMode === 'team' ? (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>Nombre d'équipes :</label>
                <input
                  type="number"
                  min={2}
                  max={players.length}
                  value={teamCount}
                  onChange={e => handleTeamCountChange(Math.max(2, Math.min(players.length, Number(e.target.value))))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#000',
                    color: '#0ff',
                    border: '1px solid #0ff',
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '12px',
                    marginBottom: '15px'
                  }}
                />
                {Array.from({ length: teamCount }).map((_, idx) => (
                  <div key={idx} style={{ border: '1px solid #0ff', marginBottom: '15px', padding: '10px', borderRadius: '5px', background: '#111' }}>
                    <label>Nom de l'équipe {idx + 1} :</label>
                    <input
                      type="text"
                      value={teams[idx]?.name || `Équipe ${idx + 1}`}
                      onChange={e => handleTeamNameChange(idx, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px',
                        backgroundColor: '#000',
                        color: '#0ff',
                        border: '1px solid #0ff',
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '12px',
                        marginBottom: '10px'
                      }}
                    />
                    <div style={{ fontSize: '11px', marginBottom: '5px' }}>Joueurs :</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {players.map(player => (
                        <label key={player.id} style={{ cursor: 'pointer', background: teams[idx]?.players?.includes(player.id) ? '#0ff3' : 'transparent', borderRadius: '3px', padding: '2px 6px' }}>
                          <input
                            type="checkbox"
                            checked={teams[idx]?.players?.includes(player.id) || false}
                            onChange={() => handleTeamPlayerToggle(idx, player.id)}
                            style={{ marginRight: '5px' }}
                          />
                          {player.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}

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
                {tournament.mode === 'simple' || tournament.mode === 'team' ? (
                  Array.from(new Set(tournament.matches.map(m => m.round))).sort().map(roundNumber => (
                    <MatchRound
                      key={roundNumber}
                      matches={tournament.matches.filter(m => m.round === roundNumber)}
                      roundNumber={roundNumber}
                      isFinal={roundNumber === Math.max(...tournament.matches.map(m => m.round))}
                      getPlayerName={getPlayerName}
                      getTeamLabel={getTeamLabel}
                      setMatchWinner={setMatchWinner}
                      tournament={tournament}
                      tournaments={tournaments}
                      setTournaments={setTournaments}
                      mode={tournament.mode}
                    />
                  ))
                ) : (
                  // ...existing code for duel...
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
        {tournaments.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7 }}>Aucun tournoi</p>
        ) : (
          tournaments.map(tournament => (
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
                  <button
                    onClick={() => {
                      // Pré-remplir la modale de création avec les propriétés du tournoi
                      setTournamentName(tournament.name + ' (rejoué)');
                      setTournamentMode(tournament.mode);
                      if (tournament.mode === 'team') {
                        setTeams(tournament.teams || []);
                        setTeamCount((tournament.teams || []).length || 2);
                      } else {
                        setSelectedPlayers(tournament.participants || []);
                      }

                      setShowCreateModal(true);
                    }}
                    style={{
                      backgroundColor: '#0ff',
                      color: '#000',
                      border: 'none',
                      padding: '5px 10px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      marginLeft: '10px'
                    }}
                  >
                    🔁 Rejouer ce tournoi
                  </button>
                </div>
              </div>
              {tournament.winner && (
                <div style={{ color: '#ff0', marginTop: '10px', fontSize: '14px' }}>
                  🏆 Vainqueur: {tournament.mode === 'team'
                    ? tournament.winner.name + ' (' + tournament.winner.players.map(getPlayerName).join(', ') + ')'
                    : getPlayerName(tournament.winner)
                  }
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