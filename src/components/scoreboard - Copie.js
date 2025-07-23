import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const ScoreButton = ({ disabled, onClick, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      margin: "0 5px",
      padding: "5px 10px",
      fontFamily: "'Press Start 2P', cursive",
      fontSize: "12px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      backgroundColor: disabled ? "#ccc" : "#222",
      color: disabled ? "#666" : "#0f0",
      border: "2px solid #0f0",
      borderRadius: "4px",
      userSelect: "none",
      transition: "0.2s",
    }}
  >
    {children}
  </button>
);

const Badge = ({ emoji, label }) => (
  <span
    title={label}
    style={{
      marginLeft: 10,
      fontSize: 18,
      userSelect: "none",
      fontWeight: "bold",
    }}
  >
    {emoji}
  </span>
);

export default function Scoreboard() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [firstRocketPlayerId, setFirstRocketPlayerId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "players"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlayers(list);

      // Recherche du premier joueur à avoir atteint 10 pts (pour badge 🚀)
      if (!firstRocketPlayerId) {
        const rocketPlayer = list.find((p) => p.score >= 10);
        if (rocketPlayer) setFirstRocketPlayerId(rocketPlayer.id);
      }
    });
    return () => unsubscribe();
  }, [firstRocketPlayerId]);

  const changeScore = async (player, delta) => {
    const playerRef = doc(db, "players", player.id);
    let newScore = player.score + delta;
    if (newScore < 0) newScore = 0;

    try {
      await updateDoc(playerRef, { score: newScore });

      // Si aucun rocket player, et que ce joueur passe 10, on le set
      if (!firstRocketPlayerId && newScore >= 10) {
        setFirstRocketPlayerId(player.id);
      }
    } catch (error) {
      console.error("Erreur changement score :", error);
    }
  };

  const resetScore = async (player) => {
    const playerRef = doc(db, "players", player.id);
    try {
      await updateDoc(playerRef, { score: 0 });
    } catch (error) {
      console.error("Erreur reset score :", error);
    }
  };

  const deletePlayer = async (player) => {
    const playerRef = doc(db, "players", player.id);
    try {
      await deleteDoc(playerRef);
      // Si on supprime le rocket player, on le reset (à améliorer pour persistance)
      if (player.id === firstRocketPlayerId) setFirstRocketPlayerId(null);
    } catch (error) {
      console.error("Erreur suppression joueur :", error);
    }
  };

  const addPlayer = async () => {
    const nameTrimmed = newPlayerName.trim();
    if (!nameTrimmed) return;
    try {
      await addDoc(collection(db, "players"), {
        name: nameTrimmed,
        score: 0,
      });
      setNewPlayerName("");
    } catch (error) {
      console.error("Erreur ajout joueur :", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addPlayer();
  };

  // Tri décroissant pour afficher (sans toucher à players original)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  // Trouver score min (pour badge 🐢)
  const minScore = players.length > 0 ? Math.min(...players.map((p) => p.score)) : 0;

  // Fonction pour obtenir badges selon règles
  const getBadges = (player, index) => {
    const badges = [];

    if (player.score > 100) badges.push(<Badge key="100" emoji="💯" label="Score > 100" />);

    if (player.id === firstRocketPlayerId) badges.push(<Badge key="rocket" emoji="🚀" label="Premier à 10 pts" />);

    if (player.score === minScore) badges.push(<Badge key="turtle" emoji="🐢" label="Score le plus bas" />);

    // Pour les 3 premiers
    if (index === 0) badges.push(<Badge key="gold" emoji="🥇" label="1er meilleur score" />);
    else if (index === 1) badges.push(<Badge key="gun" emoji="🔫" label="2e meilleur score" />);
    else if (index === 2) badges.push(<Badge key="bomb" emoji="💣" label="3e meilleur score" />);

    return badges;
  };

  return (
    <div style={{ fontFamily: "'Press Start 2P', cursive", color: "#0f0", padding: 20 }}>
      <h1>Scoreboard LAN Party</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Nom du joueur"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            padding: 8,
            fontSize: 14,
            fontFamily: "'Press Start 2P', cursive",
            marginRight: 10,
            borderRadius: 4,
            border: "2px solid #0f0",
            backgroundColor: "#111",
            color: "#0f0",
          }}
        />
        <ScoreButton onClick={addPlayer} disabled={!newPlayerName.trim()}>
          Ajouter
        </ScoreButton>
      </div>

      {players.length === 0 && <p>Aucun joueur pour l'instant...</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {sortedPlayers.map((player, index) => (
          <li
            key={player.id}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 10,
              borderBottom: "1px solid #0f0",
              paddingBottom: 5,
            }}
          >
            <div style={{ flexGrow: 1, fontSize: 16 }}>
              {player.name}
              {getBadges(player, index)}
            </div>
            <div style={{ width: 50, textAlign: "center", fontSize: 16 }}>{player.score}</div>
            <ScoreButton onClick={() => changeScore(player, 1)}>+1</ScoreButton>
            <ScoreButton onClick={() => changeScore(player, -1)} disabled={player.score <= 0}>
              -1
            </ScoreButton>
            <ScoreButton onClick={() => resetScore(player)} disabled={player.score === 0}>
              Reset
            </ScoreButton>
            <ScoreButton onClick={() => deletePlayer(player)}>Supprimer</ScoreButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
