// src/components/Clock.js
import React, { useEffect, useState } from 'react';
import '../styles/Clock.css';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const [showColon, setShowColon] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      setShowColon(prev => !prev); // alterne l'affichage du ":"
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUnit = (unit) => String(unit).padStart(2, '0');

  const hours = formatUnit(time.getHours());
  const minutes = formatUnit(time.getMinutes());
  const seconds = formatUnit(time.getSeconds());

  return (
    <div className="clock-container">
      🕒 {hours}
      <span className={`colon ${showColon ? 'visible' : 'hidden'}`}>:</span>
      {minutes}
      <span className={`colon ${showColon ? 'visible' : 'hidden'}`}>:</span>
      {seconds}
    </div>
  );
}
