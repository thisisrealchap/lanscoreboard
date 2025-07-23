import React from "react";

const ScoreButton = ({ onClick, disabled, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "8px 12px",
        margin: "0 4px",
        fontFamily: "'Press Start 2P', cursive",
        fontSize: "14px",
        backgroundColor: disabled ? "#555" : "#222",
        color: disabled ? "#aaa" : "#fff",
        border: "2px solid #444",
        borderRadius: "4px",
        transition: "all 0.3s ease",
      }}
    >
      {children}
    </button>
  );
};

export default ScoreButton;
