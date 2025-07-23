import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/Scoreboard.css';

export default function Scoreboard() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [webcamAvailable, setWebcamAvailable] = useState(null); // initial null comme dans WebcamTest
  const [previewImage, setPreviewImage] = useState(null);
  const [addingPlayer, setAddingPlayer] = useState(false);

  // Récupération des joueurs en temps réel
  useEffect(() => {
    const q = collection(db, 'players');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
      setPlayers(docs);
    });
    return () => unsubscribe();
  }, []);

useEffect(() => {
  if (!addingPlayer) return;

  let localStream = null;
  let isMounted = true;

  async function enableWebcam() {
    console.log("Tentative d'accès à la webcam...");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Succès : stream obtenu", mediaStream);

      setTimeout(() => {
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          console.log("Flux vidéo assigné via setTimeout");
          localStream = mediaStream;
          setWebcamAvailable(true);
        } else {
          console.warn("videoRef non dispo au moment du setTimeout");
          setWebcamAvailable(false);
        }
      }, 0);
    } catch (err) {
      if (isMounted) setWebcamAvailable(false);
      console.error("Erreur accès webcam :", err);
    }
  }

  enableWebcam();

  return () => {
    isMounted = false;
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };
}, [addingPlayer]);  // ✅ UNIQUEMENT addingPlayer ici


  // Ajout joueur Firestore
  async function addPlayer(name, imageData) {
    if (!name.trim()) return;
    try {
      await addDoc(collection(db, 'players'), {
        name: name.trim(),
        score: 0,
        createdAt: serverTimestamp(),
        rocket: false,
        image: imageData || null,
      });
      setNewPlayerName('');
      setPreviewImage(null);
      setAddingPlayer(false);
      setWebcamAvailable(null);
    } catch (e) {
      console.error('Erreur ajout joueur:', e);
    }
  }

  // Capture webcam image en base64
  function captureImage() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewImage(dataUrl);
  }

  // Import image fallback
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  }

  // Update score
  async function updateScore(id, delta) {
    const player = players.find(p => p.id === id);
    if (!player) return;
    const newScore = Math.max(player.score + delta, 0);
    const docRef = doc(db, 'players', id);
    const updates = { score: newScore };

    if (!player.rocket && newScore >= 10) {
      updates.rocket = true;
    }

    await updateDoc(docRef, updates);
  }

  // Reset score
  async function resetScore(id) {
    const docRef = doc(db, 'players', id);
    await updateDoc(docRef, { score: 0 });
  }

  // Remove player
  async function removePlayer(id) {
    const docRef = doc(db, 'players', id);
    await deleteDoc(docRef);
  }

  // Keyboard enter handler
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (addingPlayer) {
        addPlayer(newPlayerName, previewImage);
      } else {
        setAddingPlayer(true);
      }
    }
  }

  // Tri et badges
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const lowestScore = sortedPlayers.length ? Math.min(...sortedPlayers.map(p => p.score)) : null;

  return (
    <div className="scoreboard darkmode">
      <h1>LAN Party Scoreboard 🚀</h1>

      <div className="add-player-section">
        {!addingPlayer && (
          <button onClick={() => setAddingPlayer(true)} className="btn add-btn">
            + Ajouter un joueur
          </button>
        )}
        {addingPlayer && (
          <div className="add-player-form">
            <input
              type="text"
              placeholder="Nom du joueur"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />

           {addingPlayer && (
  <div className="webcam-preview">
    <p>
      {webcamAvailable === null && "Chargement webcam..."}
      {webcamAvailable === false && "Webcam non disponible"}
    </p>
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      width="320"
      height="240"
      style={{ border: "1px solid #ccc", marginTop: "10px" }}
    />
{webcamAvailable && (
  <>
    <button onClick={captureImage} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
      Capturer l’image
    </button>
    <canvas ref={canvasRef} style={{ display: "none" }} />
  </>
)}

  </div>
)}


            {/* Preview image */}
            {previewImage && (
              <div className="preview-image-container">
                <img src={previewImage} alt="Aperçu joueur" />
                <button className="btn remove-preview-btn" onClick={() => setPreviewImage(null)}>✖</button>
              </div>
            )}

            {/* Fallback import image */}
            <input type="file" accept="image/*" onChange={handleFileUpload} />

            <button
              className="btn confirm-btn"
              onClick={() => addPlayer(newPlayerName, previewImage)}
              disabled={!newPlayerName.trim()}
            >
              Ajouter
            </button>
            <button
              className="btn cancel-btn"
              onClick={() => {
                setAddingPlayer(false);
                setNewPlayerName('');
                setPreviewImage(null);
                setWebcamAvailable(null);
              }}
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Liste joueurs cartes */}
      <div className="players-grid">
        {sortedPlayers.map((player, index) => {
          let badge = '';
          if (index === 0) badge = '🥇';
          else if (index === 1) badge = '🔫';
          else if (index === 2) badge = '💣';
          if (player.score === lowestScore) badge = '🐢';

          if (player.rocket) badge += ' 🚀';
          if (player.score > 100) badge += ' 💯';

          return (
            <div className="player-card" key={player.id}>
              <div className="player-image">
                {player.image ? (
                  <img src={player.image} alt={`Avatar ${player.name}`} />
                ) : (
                  <div className="player-placeholder">👤</div>
                )}
              </div>
              <div className="player-info">
                <h2>{player.name}</h2>
                <p>Score: {player.score} {badge}</p>
                <div className="buttons-row">
                  <button
                    className={`btn score-btn ${player.score === 0 ? 'disabled' : ''}`}
                    onClick={() => updateScore(player.id, -1)}
                    disabled={player.score === 0}
                    title="Décrémenter"
                  >
                    -1
                  </button>
                  <button className="btn score-btn" onClick={() => updateScore(player.id, +1)} title="Incrémenter">+1</button>
                  <button className="btn reset-btn" onClick={() => resetScore(player.id)} title="Réinitialiser">Reset</button>
                  <button className="btn remove-btn" onClick={() => removePlayer(player.id)} title="Supprimer">🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canvas caché pour capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
