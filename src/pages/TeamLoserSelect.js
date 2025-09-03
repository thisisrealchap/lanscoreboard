import React, { useState } from 'react';

// Ce composant affiche un select pour choisir l'équipe perdante à affronter
// Il stocke dans team2 uniquement {name, players} pour éviter tout bug de référence
const TeamLoserSelect = ({ match, tournament, tournaments, setTournaments, getPlayerName }) => {
  const [loading, setLoading] = useState(false);
  // Génère un identifiant unique pour une équipe (nom + joueurs triés)
  const getTeamId = (team) => {
    if (!team) return '';
    return team.name + '|' + (team.players ? [...team.players].sort().join('-') : '');
  };

  // Liste des équipes perdantes disponibles
  const loserTeams = tournament.matches
    .filter(m => m.round === match.round && m.winner && m !== match)
    .map(m => m.winner.name === m.team1?.name ? m.team2 : m.team1)
    .filter(Boolean);
  const noLosersAvailable = loserTeams.length === 0;

  const handleChange = async (e) => {
    const selectedTeamId = e.target.value;
    if (!selectedTeamId) return;
    setLoading(true);
    const tournamentIndex = tournaments.findIndex(t => t.id === tournament.id);
    const updatedTournament = { ...tournaments[tournamentIndex] };
    const updatedMatches = [...updatedTournament.matches];
    const currentMatchIndex = updatedMatches.findIndex(m => m === match);
    const loserTeam = loserTeams.find(t => getTeamId(t) === selectedTeamId);
    updatedMatches[currentMatchIndex].team2 = loserTeam ? { name: loserTeam.name, players: [...loserTeam.players] } : undefined;
    // Nettoyage des undefined dans chaque match
    const cleanedMatches = updatedMatches.map(m => {
      const cleaned = { ...m };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined) delete cleaned[key];
      });
      return cleaned;
    });
    // MAJ Firestore
    const { doc, updateDoc } = await import('firebase/firestore');
    const tournamentRef = doc(require('../firebase').db, 'tournaments', tournament.id);
    await updateDoc(tournamentRef, { matches: cleanedMatches });

    // --- LOGIQUE POUR DÉBLOQUER LE ROUND SUIVANT ---
    // On vérifie si tous les matchs du round courant sont complets (team1 et team2 non null) et terminés (winner non null)
    const currentRound = match.round;
    const roundMatches = cleanedMatches.filter(m => m.round === currentRound);
    const allReady = roundMatches.every(m => m.team1 && m.team2 && m.winner);
    if (allReady) {
      // On prépare les équipes gagnantes pour le prochain round
      const winners = roundMatches.map(m => m.winner).filter(Boolean);
      // On cherche les matchs du round suivant
      const nextRound = currentRound + 1;
      const nextRoundMatches = cleanedMatches.filter(m => m.round === nextRound);
      // On assigne les équipes gagnantes aux matchs du round suivant (team1, team2)
      let idx = 0;
      for (let i = 0; i < nextRoundMatches.length; i++) {
        if (nextRoundMatches[i].waitingForLosers) continue; // On ne touche pas aux matchs "en attente de perdant"
        if (idx < winners.length) nextRoundMatches[i].team1 = winners[idx++];
        if (idx < winners.length) nextRoundMatches[i].team2 = winners[idx++];
      }
      // On met à jour Firestore avec les nouveaux matchs du round suivant
      await updateDoc(tournamentRef, { matches: cleanedMatches });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <select
        defaultValue=""
        onChange={handleChange}
        disabled={loading || noLosersAvailable}
        style={{
          backgroundColor: '#000',
          color: '#0ff',
          border: '1px solid #0ff',
          padding: '5px',
          fontSize: '10px',
          marginLeft: '10px',
          marginBottom: '10px'
        }}
      >
        <option value="">{noLosersAvailable ? 'Aucun perdant disponible' : "Choisir l'adversaire"}</option>
        {loserTeams.map(loserTeam => (
          <option key={getTeamId(loserTeam)} value={getTeamId(loserTeam)}>
            {loserTeam.name} ({loserTeam.players.map(pid => getPlayerName ? getPlayerName(pid) : pid).join(', ')})
          </option>
        ))}
      </select>
      {noLosersAvailable && (
        <span style={{ color: '#ff0', fontSize: 11, marginLeft: 8 }}>Attendez qu'un match du round soit terminé.</span>
      )}
    </div>
  );
};

export default TeamLoserSelect;