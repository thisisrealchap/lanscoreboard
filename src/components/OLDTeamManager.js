import React, { useState } from 'react';

const TeamManager = ({ players = [], teams = [], setTeams }) => {
  const [teamName, setTeamName] = useState('');
  const [memberIds, setMemberIds] = useState(['']); // Commence avec 1 joueur

  const handleAddPlayerSlot = () => {
    if (memberIds.length < 4) {
      setMemberIds([...memberIds, '']);
    }
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...memberIds];
    newMembers[index] = value;
    setMemberIds(newMembers);
  };

  const handleAddTeam = () => {
    const validIds = memberIds.filter(id => id);
    const uniqueIds = [...new Set(validIds)];

    if (!teamName || uniqueIds.length < 2 || uniqueIds.length !== validIds.length) return;

    const newTeam = {
      id: `${teamName}-${Date.now()}`,
      name: teamName,
      players: uniqueIds,
    };

    setTeams(prev => [...prev, newTeam]);
    setTeamName('');
    setMemberIds(['']);
  };

  return (
    <div className="team-manager">
      <h4>Créer une équipe</h4>

      <input
        type="text"
        value={teamName}
        onChange={e => setTeamName(e.target.value)}
        placeholder="Nom de l'équipe"
      />

      {memberIds.map((id, index) => (
        <select
          key={index}
          value={id}
          onChange={(e) => handleMemberChange(index, e.target.value)}
        >
          <option value="">Choisir un joueur</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ))}

      {memberIds.length < 4 && (
        <button type="button" onClick={handleAddPlayerSlot}>➕ Ajouter un joueur</button>
      )}

      <button
        onClick={handleAddTeam}
        disabled={
          !teamName ||
          memberIds.filter(id => id).length < 2 ||
          new Set(memberIds.filter(id => id)).size !== memberIds.filter(id => id).length
        }
      >
        🛠 Ajouter l’équipe
      </button>

      <ul>
        {teams?.map(team => (
          <li key={team.id}>
            {team.name} ({team.players.length} joueurs)
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamManager;
