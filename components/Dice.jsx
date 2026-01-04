"use client";
import React from "react";

export default function Dice({ value, onRoll, disabled }) {
  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <button
        onClick={onRoll}
        disabled={disabled}
        style={{
          padding: "1rem 2rem",
          fontSize: "1.5rem",
          borderRadius: "10px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: "#f1c40f",
          border: "none",
        }}
      >
        Roll Dice
      </button>
      {value && <p style={{ fontSize: "2rem", marginTop: "1rem" }}>🎲 {value}</p>}
    </div>
  );
}
