"use client";
import React, { useState } from "react";
import Token from "./Token"; // your 3D Token component

export default function LudoBoard() {
  const boardSize = 720;
  const cell = boardSize / 15;

  const colors = {
    red: "#ff0000",
    green: "#00c91c",
    blue: "#0050ff",
    yellow: "#ffe600",
  };

  const fadedColors = {
    red: "#f6babaff",
    green: "#b5ff8dff",
    blue: "#b8dcffff",
    yellow: "#f5efb9ff",
  };

  const homeImages = {
    red: "/img/redhome.jpeg",
    green: "/img/greenhome.jpeg",
    blue: "/img/bluehome.jpeg",
    yellow: "/img/yellowhome.jpeg",
  };

  const tokenOffset = [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ];

  const [currentPlayer, setCurrentPlayer] = useState("red");

  const Cell = ({ x, y, color, children }) => (
    <div
      className="absolute flex items-center justify-center"
      style={{
        width: cell,
        height: cell,
        top: y * cell,
        left: x * cell,
        backgroundColor: color || "white",
        boxSizing: "border-box",
        outline: "1px solid #111",
        outlineOffset: "-1px",
      }}
    >
      {children}
    </div>
  );

  const stars = [
    { x: 1, y: 6 }, { x: 6, y: 2 },
    { x: 8, y: 1 }, { x: 12, y: 6 },
    { x: 13, y: 8 }, { x: 8, y: 12 },
    { x: 6, y: 13 }, { x: 2, y: 8 },
  ];

  // Final stretch positions
  const stretch = {
    red: Array.from({ length: 5 }, (_, i) => ({ x: 1 + i, y: 7 })),
    green: Array.from({ length: 5 }, (_, i) => ({ x: 7, y: 1 + i })),
    blue: Array.from({ length: 5 }, (_, i) => ({ x: 7, y: 9 + i })),
    yellow: Array.from({ length: 5 }, (_, i) => ({ x: 9 + i, y: 7 })),
  };

    // Outer tracks (faded)
  const outerTracks = [
    // Red: top-left → center
    { color: "red", positions: [
      [0,6],[1,6],[2,6],[3,6],[4,6],[5,6], // horizontal top
      [6,5],[6,4],[6,3],[6,2],[6,1],[6,0]  // vertical toward center
    ]},

    // Green: top-right → center
    { color: "green", positions: [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5], // vertical down
      [9,6],[10,6],[11,6],[12,6],[13,6],[14,6] // horizontal toward center
    ]},

    // Blue: bottom-left → center
    { color: "blue", positions: [
      [6,9],[6,10],[6,11],[6,12],[6,14], // vertical up
      [5,8],[4,8],[3,8],[2,8],[1,8],[0,8] // horizontal toward center
    ]},

    // Yellow: bottom-right → center
    { color: "yellow", positions: [
      [8,14],[8,13],[8,12],[8,11],[8,10],[8,9], // vertical up
      [9,8],[10,8],[11,8],[12,8],[13,8],[14,8] // horizontal toward center
    ]},
  ];

  // Home positions
  const homes = [
    { color: "red", top: 0, left: 0 },
    { color: "green", top: 0, left: cell * 9 },
    { color: "yellow", top: cell * 9, left: cell * 9 },
    { color: "blue", top: cell * 9, left: 0 },
  ];

  return (
    <div className="flex items-center justify-center p-6">
      <div
        className="relative shadow-2xl"
        style={{ width: boardSize, height: boardSize, backgroundColor: "#fff" }}
      >
        {/* Grid */}
        {[...Array(15)].map((_, y) =>
          [...Array(15)].map((_, x) => (
            <div
              key={`${x}-${y}`}
              className="absolute"
              style={{
                top: y * cell,
                left: x * cell,
                width: cell,
                height: cell,
                outline: "1px solid #ccc",
                outlineOffset: "-1px",
              }}
            />
          ))
        )}

        {/* Home blocks with images + tokens */}
        {homes.map((h) => (
          <div
            key={h.color}
            className="absolute"
            style={{
              top: h.top,
              left: h.left,
              width: cell * 6,
              height: cell * 6,
              border: `40px solid ${colors[h.color]}`,
              borderRadius: 0,
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <img
              src={homeImages[h.color]}
              alt={`${h.color} home`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Tokens */}
            {tokenOffset.map((off, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: `${off.y * 100}%`,
                  left: `${off.x * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Token color={colors[h.color]} active={currentPlayer === h.color} />
              </div>
            ))}
          </div>
        ))}

        {/* Outer tracks (faded) */}
        {outerTracks.map((track) =>
          track.positions.map(([x, y], i) => (
            <Cell key={`${track.color}-track-${i}`} x={x} y={y} color={fadedColors[track.color]} />
          ))
        )}

        {/* Stars */}
        {stars.map((s, i) => (
          <Cell key={`star-${i}`} x={s.x} y={s.y}>
            <span style={{ fontSize: cell * 0.7 }}>⭐</span>
          </Cell>
        ))}

        {/* Final stretches (solid) */}
        {Object.entries(stretch).map(([col, cells]) =>
          cells.map((p, i) => (
            <Cell key={`${col}-stretch-${i}`} x={p.x} y={p.y} color={colors[col]} />
          ))
        )}

        {/* Center box */}
        <div
          className="absolute"
          style={{
            top: cell * 6,
            left: cell * 6,
            width: cell * 3,
            height: cell * 3,
            backgroundImage: "url('/img/cool_lion.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 0,
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </div>
  );
}
