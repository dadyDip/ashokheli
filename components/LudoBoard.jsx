"use client";
import React, { useEffect, useRef, useState } from "react";
import Token from "./Token";
import LudoWinOverlay from "@/components/ludo/LudoWinOverlay";
import { useLudoGame } from "@/context/GameContext";
import Confetti from "react-confetti";

function LudoWinningHUD({ amount }) {
  if (!amount) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 2000,
        padding: "10px 14px",
        borderRadius: 14,
        background:
          "linear-gradient(145deg, rgba(6,78,59,0.95), rgba(2,44,34,0.95))",
        boxShadow:
          "0 0 30px rgba(0,255,180,0.25), inset 0 0 18px rgba(0,0,0,0.6)",
        color: "#eafff7",
        fontWeight: 800,
        fontSize: 14,
        backdropFilter: "blur(6px)",
      }}
    >
      💰 Winning&nbsp;
      <span style={{ color: "#facc15" }}>
        TK{amount}
      </span>
    </div>
  );
}

function useLudoSounds() {
  const ref = React.useRef({});

  React.useEffect(() => {
    ref.current = {
      roll: new Audio("/sounds/dice.mp3"),
      move: new Audio("/sounds/move.mp3"),
      cut: new Audio("/sounds/cut.mp3"),
      out: new Audio("/sounds/out.mp3"),
      finish: new Audio("/sounds/finish.mp3"),
      win: new Audio("/sounds/win.mp3"),
    };
  }, []);

  return (name) => {
    const s = ref.current[name];
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
  };
}

export default function LudoBoard({

  phase,
  winningAmount,
  piecesData = {},
  playersData = {},
  currentTurn = null,
  dice = null,
  onRoll = () => {},
  onMovePiece = () => {},
  currentPlayer,
  lastMove = null,
  showWaiting = false,
}) {
  const { room } = useLudoGame();
  
  const winningAmountp = winningAmount ?? room?.winningAmount ?? 0;
  const safeWinningAmount = winningAmountp / 100;
  const [rolling, setRolling] = useState(false);


  const [viewport, setViewport] = React.useState({
    w: typeof window !== "undefined" ? window.innerWidth : 720,
    h: typeof window !== "undefined" ? window.innerHeight : 720,
  });

  React.useEffect(() => {
    const update = () => {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);


  const SAFE_MARGIN = 16;

  const boardSize = Math.min(
    viewport.w - SAFE_MARGIN * 2,
    viewport.h - SAFE_MARGIN * 2,
    720
  );
  const effectivePlayersData =
  phase === "waiting"
    ? room?.playersData || {}
    : playersData;

  const playSound = useLudoSounds();

  /* ================= MOVE-BASED SOUNDS ================= */
  const lastMoveRef = useRef(null);

  useEffect(() => {
    if (!lastMove || lastMoveRef.current === lastMove.id) return;
    lastMoveRef.current = lastMove.id;

    if (lastMove.from === -1 && lastMove.to === 0) {
      playSound("out");
    }
    if (lastMove.to >= FINISH_POS) {
      playSound("finish");
    }
  }, [lastMove]);


  const cell = boardSize / 15;
  const scale = boardSize / 720;
  const boardRef = useRef(null);

  const isMobile = viewport.w < 480;
  const HUD_SCALE = isMobile ? 1.6 : 1.2;
  const DICE_SCALE = isMobile ? 1.15 : 1;


  const HUD_ORIGIN = isMobile ? "center" : "top left";

  const TOKEN_SIZE = (isMobile ? 38 : 45) * scale;
  const DICE_SIZE = (isMobile ? 36 : 42) * scale;


  /* ================= CONSTANTS ================= */
  const GLOBAL_PATH_LEN = 52;
  const LAST_GLOBAL_POS = 50;
  const STRETCH_LEN = 5;
  const FINISH_POS = 56;

  /* ================= COLORS ================= */
  const homeZones = {
    red:    { x: 0, y: 0 },
    green:  { x: 9, y: 0 },
    yellow: { x: 9, y: 9 },
    blue:   { x: 0, y: 9 },
  };

  const colors = {
    red: "#E53935",
    green: "#43A047",
    blue: "#1E88E5",
    yellow: "#FDD835",
  };

  const glowRing = (color, strength = 1) => `
    0 0 ${12 * strength}px ${color},
    0 0 ${24 * strength}px ${color}99,
    0 0 ${40 * strength}px ${color}66
  `;


  const faded = {
    red: "#e72f2f",
    green: "#219d3b",
    blue: "#326bcc",
    yellow: "#e2cb35",
    neutral: "#f7f7f7",
  };

  const homeImages = {
    red: "/img/redhome.jpg",
    green: "/img/greenhome.jpg",
    blue: "/img/bluehome.jpg",
    yellow: "/img/yellowhome.jpg",
  };

  const safeCells = [1, 9, 14, 22, 27, 35, 40, 48];

  /* ================= GLOBAL PATH ================= */
  const globalPath = [
    { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 },
    { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
    { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
    { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
    { x: 14, y: 7 }, { x: 14, y: 8 }, { x: 13, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 },
    { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }, { x: 8, y: 13 }, { x: 8, y: 14 },
    { x: 7, y: 14 }, { x: 6, y: 14 }, { x: 6, y: 13 }, { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 },
    { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 },
    { x: 0, y: 7 },
  ];

  const startIndex = { red: 1, green: 14, yellow: 27, blue: 40 };


  const stretch = {
    red: Array.from({ length: STRETCH_LEN }, (_, i) => ({ x: 1 + i, y: 7 })),
    green: Array.from({ length: STRETCH_LEN }, (_, i) => ({ x: 7, y: 1 + i })),
    yellow: Array.from({ length: STRETCH_LEN }, (_, i) => ({ x: 13 - i, y: 7 })),
    blue: Array.from({ length: STRETCH_LEN }, (_, i) => ({ x: 7, y: 13 - i })),
  };

  const FINISH_STACK = {
    green: { axis: "x", side: -1 },
    blue: { axis: "x", side: 1 },
    red: { axis: "y", side: -1 },
    yellow: { axis: "y", side: 1 },
  };


  /* ================= HELPERS ================= */
  const getCoords = (color, pos) => {
    if (pos >= FINISH_POS) return { x: 7, y: 7 };
    if (pos <= LAST_GLOBAL_POS) {
      const idx = (startIndex[color] + pos) % GLOBAL_PATH_LEN;
      return globalPath[idx];
    }
    return stretch[color][pos - (LAST_GLOBAL_POS + 1)];
  };
    /* ================= WAITING SCREEN ================= */
  if (phase === "waiting") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at center, #0b1c17, #020504)",
        }}
      >
        <div
          className="relative"
          style={{
            width: "90vmin",
            height: "90vmin",
            maxWidth: 720,
            maxHeight: 720,
          }}
        >
          {/* BOARD FRAME */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              boxShadow: "0 0 80px rgba(0,255,200,0.15)",
              background: "#050806",
            }}
          />

          {/* PLAYER HOMES */}
          {["red", "green", "yellow", "blue"].map((color) => {
              const player = Object.values(effectivePlayersData).find(
                (p) => p.color === color
              );

            const pos = homeZones[color];

            return (
              <div
                key={color}
                style={{
                  position: "absolute",
                  left: pos.x * (100 / 15) + "%",
                  top: pos.y * (100 / 15) + "%",
                  width: "40%",
                  height: "40%",
                  background: `radial-gradient(circle at top left, ${colors[color]}, #000)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* PREMIUM PLAYER CARD */}
                <div
                  style={{
                    padding: 24,
                    borderRadius: 18,
                    minWidth: 180,
                    textAlign: "center",
                    background: "rgba(0,0,0,0.65)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${colors[color]}55`,
                    boxShadow: `0 0 24px ${colors[color]}55`,
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      opacity: 0.7,
                      letterSpacing: 1,
                    }}
                  >
                    PLAYER
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 22,
                      fontWeight: 800,
                      color: colors[color],
                    }}
                  >
                    {player?.name || "Waiting…"}
                  </div>
                </div>
              </div>
            );
          })}

          {/* CENTER BRAND */}
          <div
            style={{
              position: "absolute",
              inset: "35%",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontFamily: "'Exo 2', sans-serif",
              fontStyle: "italic",
              fontWeight: 700,
              color: "#f4f2f2ff",
              letterSpacing: "1.1px",
              transform: "skewX(-6deg)",
              textShadow: "0 3px 8px rgba(0,0,0,0.5)",
            }}
          >
            AyKheli
          </div>
        </div>
      </div>
    );
  }
  const Cell = ({ x, y, bg, star }) => (
    <div
      style={{
        position: "absolute",
        top: y * cell,
        left: x * cell,
        width: cell,
        height: cell,
        background: bg,
        border: "1px solid #222",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
      }}
    >
      {star && "★"}
    </div>
  );
  const Dice = ({ value }) => (
    <div
      onClick={onRoll}
      className="dice"
      style={{
        width: DICE_SIZE,
        height: DICE_SIZE,
        borderRadius: 8,
        background: "#fff",
        color:"#000",
        display: "grid",
        placeItems: "center",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      {value}
    </div>
  );

  useEffect(() => {
    if (dice == null) return;

    setRolling(true);
    const t = setTimeout(() => setRolling(false), 400);

    return () => clearTimeout(t);
  }, [dice]);


  const homeBlocks = {
    red: { labelX: 1, labelY: 6.3 },
    green: { labelX: 7, labelY: 1 },
    yellow: { labelX: 13.5, labelY: 7 },
    blue: { labelX: 1, labelY: 13.5 },
  };

  /* ================= RENDER ================= */
return (
  <div className="fixed inset-0 bg-[#4f37c4] overflow-hidden">
    {/* FELT TEXTURE OVERLAY */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: "url('/textures/felt.jpg')",
        backgroundRepeat: "repeat",
        backgroundSize: "420px 420px",
        opacity: 0.45,
        mixBlendMode: "overlay",
      }}
    />

    <div
      className="
        absolute z-50
        top-2 left-2
        block md:hidden
        pointer-events-none
        max-w-full
      "
      style={{
        transform: "scale(1.3)",
        transformOrigin: "top left",
      }}
    >

      <h1
        className="
          antialiased
          text-2xl
          font-semibold
          tracking-wide
          text-black
          whitespace-nowrap
        "
        style={{
          fontFamily: "'Story Script', cursive",
          lineHeight: "1.2",
        }}
      >
        AshoKheli
      </h1>
    </div>


    {/* 💰 WINNING AMOUNT (FIXED TOP-RIGHT) */}
    {safeWinningAmount > 0 && (
      <div
        className="fixed top-3 right-3 z-[1000]
                   bg-black/75 backdrop-blur-md
                   text-yellow-400 font-extrabold
                   px-4 py-2 rounded-xl
                   shadow-[0_0_18px_rgba(255,215,0,0.4)]"
      >
        💰 TK {safeWinningAmount}
      </div>
    )}

    {/* CENTERING WRAPPER */}
    <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
      {/* BOARD CONTAINER */}
      <div
        ref={boardRef}
        className="relative rounded-[28px]"
        style={{
          width: boardSize,
          height: boardSize,
          maxWidth: "92vw",
          maxHeight: "92vw",
          aspectRatio: "1 / 1",
          background: "rgba(0,0,0,0.15)",
          boxShadow:
            "inset 0 0 90px rgba(0,0,0,0.85), 0 0 60px rgba(0,255,180,0.25)",
        }}
      >
        {/* BOARD INNER */}
        <div
          className="absolute inset-0 rounded-[24px]"
          style={{
            touchAction: "none",
          }}
        >
          {/* PLAYER HUD (OUTSIDE BOARD) */}
          {Object.values(playersData).map(player => {
            if (!player?.color) return null;

            const isTurn = currentTurn === player.playerId;
            const HUD_OFFSET = 8 * scale;

            const HUD_MOBILE_SCALE = isMobile ? 0.6 : 1;

            const desktopPositions = {
              red:    { top: HUD_OFFSET, left: HUD_OFFSET },
              green:  { top: HUD_OFFSET, right: HUD_OFFSET },
              yellow: { bottom: HUD_OFFSET, right: HUD_OFFSET },
              blue:   { bottom: HUD_OFFSET, left: HUD_OFFSET },
            };

            const mobilePositions = {
              red:    { top: -DICE_SIZE - 8, left: 0 },
              green:  { top: -DICE_SIZE - 8, right: 0 },
              yellow: { bottom: -DICE_SIZE - 8, right: 0 },
              blue:   { bottom: -DICE_SIZE - 8, left: 0 },
            };

            const pos = isMobile
              ? mobilePositions[player.color]
              : desktopPositions[player.color];

            const diceFirst =
              !isMobile && (player.color === "green" || player.color === "yellow");

            return (
              <div
                key={player.playerId}
                style={{
                  position: "absolute",
                  ...pos,
                  zIndex: 1000,

                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  borderRadius: 12,

                  background: colors[player.color],
                  color: "#fff",
                  fontWeight: 700,

                  transform: `scale(${HUD_SCALE * HUD_MOBILE_SCALE})`,
                  transformOrigin: HUD_ORIGIN,

                  boxShadow: isTurn
                    ? `
                        0 0 0 2px ${colors[player.color]},
                        0 0 8px ${colors[player.color]}aa,
                        inset 0 1px 0 rgba(255,255,255,0.35)
                      `

                    : `
                        0 6px 16px rgba(0,0,0,0.45),
                        inset 0 1px 0 rgba(255,255,255,0.25)
                      `,
                  animation: isTurn
                    ? "hudGlow 2.6s infinite ease-in-out"
                    : "none",

                }}
              >
                {isTurn && !isMobile && diceFirst && (
                  <Dice value={dice ?? 1} scale={DICE_SCALE} />
                )}


                <span
                  style={{
                    fontSize: 12 * HUD_SCALE,
                    maxWidth: 70,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {player.name || player.playerId}
                </span>

                {isTurn && !isMobile && !diceFirst && (
                  <Dice value={dice ?? 1} scale={DICE_SCALE} />
                )}
              </div>
            );
          })}


          {/* GRID */}
          {[...Array(15)].map((_, y) =>
            [...Array(15)].map((_, x) => (
              <Cell key={`${x}-${y}`} x={x} y={y} bg="#fafafa" />
            ))
          )}

          {/* PATH */}
          {globalPath.map((p, i) => (
            <Cell key={i} x={p.x} y={p.y} bg={faded.neutral} star={safeCells.includes(i)} />
          ))}

          {/* STRETCH */}
          {Object.entries(stretch).map(([c, cells]) =>
            cells.map((p, i) => <Cell key={`${c}-${i}`} x={p.x} y={p.y} bg={faded[c]} />)
          )}

          {/* HOME */}
          {["red", "green", "yellow", "blue"].map((c, i) => {
            const pos = [
              { x: 0, y: 0 },
              { x: 9, y: 0 },
              { x: 9, y: 9 },
              { x: 0, y: 9 },
            ][i];

            return (
              <div key={c} style={{
                position: "absolute",
                top: pos.y * cell,
                left: pos.x * cell,
                width: cell * 6,
                height: cell * 6,
                background: colors[c],
                border: "1px solid #111",
              }}>
                <div style={{
                  position: "absolute",
                  inset: 8,
                  background: `url(${homeImages[c]}) center/cover`,
                }} />
              </div>
            );
          })}

          {/* CENTER PINWHEEL */}
          {["red", "green", "yellow", "blue"].map((c, i) => (
            <div
              key={c}
              style={{
                position: "absolute",
                top: 6 * cell,
                left: 6 * cell,
                width: cell * 3,
                height: cell * 3,
                clipPath: [
                  "polygon(50% 50%, 100% 0, 100% 100%)",
                  "polygon(50% 50%, 0 0, 100% 0)",
                  "polygon(50% 50%, 0 100%, 0 0)",
                  "polygon(50% 50%, 100% 100%, 0 100%)",
                ][i],
                background: colors[c],
              }}
            />
          ))}


          {/* TOKENS */}
          {Object.values(piecesData).flatMap(player =>
            player.pieces.map((pos, i) => {
              let px, py;
              let stackIndex = 0;
              let stackCount = 1;
              let scale = 1;

              if (pos === -1) {
                const base = {
                  red: { x: 3, y: 3 },
                  green: { x: 12, y: 3 },
                  yellow: { x: 12, y: 12 },
                  blue: { x: 3, y: 12 },
                }[player.color];

                const off = [
                  [-1, -1], [1, -1], [-1, 1], [1, 1]
                ][i];

                px = (base.x + off[0] * 0.9) * cell;
                py = (base.y + off[1] * 0.9) * cell;
              } else {
                const { x, y } = getCoords(player.color, pos);

                const sameCell = [];

                Object.values(piecesData).forEach(pl => {
                  pl.pieces.forEach((p, pi) => {
                    if (p < 0) return;
                    const c = getCoords(pl.color, p);
                    if (c.x === x && c.y === y) {
                      sameCell.push({
                        color: pl.color,
                        index: pi,
                        isCurrent: pl.color === currentPlayer,
                      });
                    }
                  });
                });

                /* 🔥 SORT: current player token LAST = on top */
                sameCell.sort((a, b) => {
                  if (a.isCurrent === b.isCurrent) return 0;
                  return a.isCurrent ? 1 : -1;
                });


                stackCount = sameCell.length;

                stackIndex = sameCell.findIndex(
                  t => t.color === player.color && t.index === i
                );
                const isFinishCell = pos >= FINISH_POS;
                if (isFinishCell) {
                  const { axis, side } = FINISH_STACK[player.color];
                  const gap = TOKEN_SIZE * 0.7;

                  const finishedTokens = Object.values(piecesData)
                    .find(p => p.color === player.color)
                    .pieces
                    .map((p, idx) => ({ pos: p, idx }))
                    .filter(t => t.pos >= FINISH_POS);

                  const order = finishedTokens.findIndex(t => t.idx === i);

                  px = x * cell + cell / 2;
                  py = y * cell + cell / 2;

                  const centerOffset = (finishedTokens.length - 1) / 2;

                  if (axis === "x") {
                    px += (order - centerOffset) * gap;
                    py += side * gap;
                  } else {
                    py += (order - centerOffset) * gap;
                    px += side * gap;
                  }

                  scale = 0.75;
                }
                else {
                  // normal horizontal stacking
                  const reveal = stackCount > 1 ? TOKEN_SIZE * 0.3 : 0;
                  const offset = (stackCount - 1) * reveal * 0.5;

                  px = x * cell + cell / 2 + stackIndex * reveal - offset;
                  py = y * cell + cell / 2;

                  scale = stackCount > 1 ? 0.8 : 1;
                }

              }

              const isTopOfStack = stackIndex === stackCount - 1;
              const isClickable =
                player.color === currentPlayer && isTopOfStack;

              return (
                <div
                  key={`${player.color}-${i}`}
                  className={stackCount > 1 ? "animate-stack-pop" : ""}
                  style={{
                    position: "absolute",
                    top: py,
                    left: px,
                    transform: `translate(-50%,-50%) scale(${scale})`,
                    zIndex: 10 + stackIndex,
                    transition: "top 250ms ease, left 250ms ease, transform 250ms ease",
                    cursor: isClickable ? "pointer" : "default",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    pointerEvents: isClickable ? "auto" : "none",
                  }}
                  onClick={() => isClickable && onMovePiece(i) && playSound("move")}
                >
                  <Token
                    color={colors[player.color]}
                    size={TOKEN_SIZE}
                    active={isClickable}
                    winner={room?.winner?.color === player.color}
                  />
                </div>
              );
            })
          )}
          <style jsx global>{`
            @keyframes stack-pop {
              0% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            .animate-stack-pop {
              animation: stack-pop 200ms ease-out;
            }
              .player-hud.active {
                box-shadow:
                  0 0 12px rgba(255,255,255,0.6),
                  0 0 24px currentColor;
                animation: pulse 1.4s infinite;
              }
              @keyframes hudGlow {
                0% {
                  box-shadow:
                    0 0 0 3px currentColor,
                    0 0 12px currentColor;
                }
                50% {
                  box-shadow:
                    0 0 0 3px currentColor,
                    0 0 32px currentColor;
                }
                100% {
                  box-shadow:
                    0 0 0 3px currentColor,
                    0 0 12px currentColor;
                }
              }

              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.06); }
                100% { transform: scale(1); }
              }
              @keyframes dicePulse {
                0%   { box-shadow: 0 0 12px currentColor; }
                50%  { box-shadow: 0 0 32px currentColor; }
                100% { box-shadow: 0 0 12px currentColor; }
              }

              .dice {
                animation: roll 0.4s ease;
              }

              @keyframes roll {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }

              @media (max-width: 480px) {
                .player-hud {
                  font-size: 12px;
                  padding: 4px 8px;
                }
              }
                

          `}</style>
          {isMobile && boardRef.current && currentTurn && (() => {
            const rect = boardRef.current.getBoundingClientRect();
            const viewportH = window.innerHeight;
            const activePlayer = Object.values(playersData)
              .find(p => p.playerId === currentTurn);

            const activeColor = activePlayer
              ? colors[activePlayer.color]
              : "#fff";


            const freeSpace = viewportH - (rect.top + rect.height);
            const diceTop = rect.top + rect.height + freeSpace / 2 - 36;

            return (
              <div
                style={{
                  position: "fixed",
                  top: diceTop,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 5000,
                }}
              >
              <div
                onClick={onRoll}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  background: "linear-gradient(145deg, #ffffff, #dcdcdc)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#111",
                  cursor: "pointer",
                  userSelect: "none",
                  boxShadow: `
                    inset -4px -4px 8px rgba(0,0,0,0.12),
                    inset 4px 4px 8px rgba(255,255,255,0.9),
                    ${glowRing(activeColor, 1.1)}
                  `,
                  border: `3px solid ${activeColor}`,
                  animation: "dicePulse 1.6s infinite",
                  transform: rolling ? "rotate(360deg)" : "rotate(0deg)",
                  transition: "transform 0.4s ease",

                }}
              >

                  {dice ?? 1}
                </div>
              </div>
            );
          })()}
          {room?.phase === "ended" && (
            <>
              <Confetti recycle={false} numberOfPieces={220} />
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(0,0,0,0.45)",
                  zIndex: 3000,
                }}
              >
                <div
                  style={{
                    padding: 36,
                    borderRadius: 26,
                    background:
                      "linear-gradient(145deg, #064e3b, #022c22)",
                    boxShadow:
                      "0 0 60px rgba(0,255,180,0.35)",
                    color: "#ecfdf5",
                    textAlign: "center",
                  }}
                >
                  <h1 style={{ fontSize: 42 }}>🏆 You Win!</h1>
                  <div style={{ marginTop: 12, fontSize: 22 }}>
                    💰 TK{room.winningAmount}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  </div>  
  );
}
