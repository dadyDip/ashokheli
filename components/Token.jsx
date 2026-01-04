import React from "react";
import "./Token.css";

export default function Token({
  color = "red",
  active = false,
  size = 40,
  winner = false, // ✅ NEW (optional)
}) {
  return (
    <button
      className={`
        glass-icon
        ${active ? "active" : ""}
        ${winner ? "winner" : ""}
      `}
      style={{
        "--token-color": color,
        "--size": `${size}px`,
      }}
      aria-label="Player token"
    >
      <div className="glass"></div>
      <div className="holo"></div>
      <div className="sheen"></div>
      <div className="rim"></div>

      <div className="inner" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M12 2l1.9 4.2L18 8.3l-4 2.1L14 16 12 13.5 10 16l.1-5.6L6 8.3l4.1-2.1L12 2z"
            fill="url(#g)"
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#b6fffe" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </button>
  );
}
