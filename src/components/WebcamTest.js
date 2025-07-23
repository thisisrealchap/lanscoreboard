import React, { useEffect, useRef, useState } from 'react';

const WebcamTest = () => {
  const videoRef = useRef(null);
  const [webcamAvailable, setWebcamAvailable] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let localStream = null;

    async function enableWebcam() {
      console.log("Tentative d'accès à la webcam...");
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Succès : stream obtenu", mediaStream);

        if (isMounted && videoRef.current) {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              console.log("Flux vidéo assigné via setTimeout");
            } else {
              console.warn("videoRef toujours null après setTimeout");
            }
          }, 0);
          localStream = mediaStream;
          setWebcamAvailable(true);
        } else {
          console.warn("videoRef non dispo au moment de l'assignation");
        }
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
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Test Webcam</h3>
      {webcamAvailable === null && <p>Chargement...</p>}
      {webcamAvailable === false && <p style={{ color: 'red' }}>Webcam non disponible</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="400"
        height="300"
        style={{ border: '2px solid black', marginTop: '10px' }}
      />
    </div>
  );
};

export default WebcamTest;
