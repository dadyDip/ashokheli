import React, { useState, useEffect, useRef } from "react";

// Fullscreen HD LudoBoard + 4 visual styles (A-D) + interactive glass/holo tokens
// How to use: drop this file into a React app (e.g. src/LudoBoard.jsx) and import <LudoBoard />

export default function LudoBoard() {
  const boardRef = useRef(null);
  const [styleVariant, setStyleVariant] = useState("A"); // A, B, C, D
  const [tokenShape, setTokenShape] = useState("glass"); // glass, disc, cylinder
  const [colorVariant, setColorVariant] = useState("neon"); // pure, neon, holo
  const [boardSizing, setBoardSizing] = useState("fullscreen"); // fullscreen, 80vw, responsive

  // Example token state: four players, each with 4 tokens (positions simplified)
  const initialPlayers = [
    { id: "green", color: "#17c964" },
    { id: "yellow", color: "#ffd24a" },
    { id: "red", color: "#ff4d6d" },
    { id: "blue", color: "#4da6ff" },
  ];

  const [players] = useState(initialPlayers);
  // tokens: {playerId, idx, pos: {x,y}, selected, glowing }
  const [tokens, setTokens] = useState(() => {
    const t = [];
    initialPlayers.forEach((p, pi) => {
      for (let i = 0; i < 4; i++) {
        // initial positions in home corners (normalized 0..14 grid)
        const homePositions = {
          green: { x: 1 + (i % 2), y: 1 + Math.floor(i / 2) },
          yellow: { x: 13 - (i % 2), y: 1 + Math.floor(i / 2) },
          red: { x: 13 - (i % 2), y: 13 - Math.floor(i / 2) },
          blue: { x: 1 + (i % 2), y: 13 - Math.floor(i / 2) },
        };
        t.push({ id: `${p.id}-${i}`, player: p.id, idx: i, pos: homePositions[p.id], selected: false, glowing: false });
      }
    });
    return t;
  });

  const [currentTurn, setCurrentTurn] = useState(0); // index of players

  // Responsive board size
  const [boardSize, setBoardSize] = useState(720);

  useEffect(() => {
    function calc() {
      if (!boardRef.current) return;
      const vw = Math.max(window.innerWidth, 320);
      const vh = Math.max(window.innerHeight, 480);
      if (boardSizing === "fullscreen") {
        // keep square based on min dimension with some padding
        const s = Math.min(vw - 64, vh - 96);
        setBoardSize(Math.max(560, Math.floor(s)));
      } else if (boardSizing === "80vw") {
        const s = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8);
        setBoardSize(Math.max(480, Math.floor(s)));
      } else {
        setBoardSize(720);
      }
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [boardSizing]);

  // Helper: pick token fill based on colorVariant and player color
  function tokenFill(baseHex) {
    if (colorVariant === "pure") return baseHex;
    if (colorVariant === "neon") return `linear-gradient(180deg, ${shade(baseHex, 30)}, ${shade(baseHex, -10)})`;
    if (colorVariant === "holo") return `conic-gradient(from 120deg, ${baseHex}, #ff66c4, #7af0ff, ${baseHex})`;
    return baseHex;
  }

  // small utility to darken/lighten hex
  function shade(hex, percent) {
    // hex like #rrggbb
    const h = hex.replace('#', '');
    const num = parseInt(h, 16);
    let r = (num >> 16) + Math.round(2.55 * percent);
    let g = ((num >> 8) & 0x00ff) + Math.round(2.55 * percent);
    let b = (num & 0x0000ff) + Math.round(2.55 * percent);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  // token click: select / move
  function onTokenClick(tokenId) {
    setTokens(prev => prev.map(t => ({ ...t, selected: t.id === tokenId ? !t.selected : false })));
  }

  // simulate move: move selected token one step towards center stretch for demo
  function moveSelectedToken() {
    setTokens(prev => {
      const sel = prev.find(t => t.selected);
      if (!sel) return prev;
      const newPos = { ...sel.pos };
      // naive move: nudge toward center (7,7)
      if (newPos.x < 7) newPos.x += 1;
      else if (newPos.x > 7) newPos.x -= 1;
      if (newPos.y < 7) newPos.y += 1;
      else if (newPos.y > 7) newPos.y -= 1;
      return prev.map(t => t.id === sel.id ? { ...t, pos: newPos, selected: false, glowing: true } : t).map(t => t.id === sel.id ? { ...t, glowing: true } : t);
    });
    // brief extra glow layer
    setTimeout(() => {
      setTokens(prev => prev.map(t => ({ ...t, glowing: false })));
      // next player's turn
      setCurrentTurn(ct => (ct + 1) % players.length);
    }, 800);
  }

  // glow effect when it's a player's turn
  useEffect(() => {
    // set glowing for tokens of current player (subtle pulse)
    setTokens(prev => prev.map(t => ({ ...t, turnGlow: players[currentTurn].id === t.player })));
  }, [currentTurn, players]);

  // grid cell size 15x15
  const cell = boardSize / 15;

  // stars and stretches from your earlier code (kept)
  const stars = [
    { x: 1, y: 6 }, { x: 6, y: 2 }, { x: 8, y: 1 }, { x: 12, y: 6 },
    { x: 13, y: 8 }, { x: 8, y: 12 }, { x: 6, y: 13 }, { x: 2, y: 8 },
  ];
  const stretch = {
    red:   Array.from({ length: 6 }, (_, i) => ({ x: 7, y: 1 + i })),
    yellow:Array.from({ length: 6 }, (_, i) => ({ x: 13 - i, y: 7 })),
    blue:  Array.from({ length: 6 }, (_, i) => ({ x: 7, y: 13 - i })),
    green: Array.from({ length: 6 }, (_, i) => ({ x: 1 + i, y: 7 })),
  };

  // render helpers
  function Cell({ x, y, color = 'transparent', border = true, children }) {
    return (
      <div
        style={{
          position: 'absolute',
          width: cell,
          height: cell,
          top: y * cell,
          left: x * cell,
          background: color,
          boxSizing: 'border-box',
          border: border ? '1px solid rgba(0,0,0,0.12)' : 'none',
        }}
      >
        {children}
      </div>
    );
  }

  // Glass/Holo token component
  function GlassToken({ token }) {
    const player = players.find(p => p.id === token.player);
    const size = cell * 0.6;
    const bright = token.glowing ? 1.25 : 1;
    const turnPulse = token.turnGlow ? { boxShadow: '0 0 24px rgba(255,255,255,0.06), 0 0 40px ' + hexToRgba(player.color, 0.18) } : {};

    // style variants
    const common = {
      width: size,
      height: size,
      borderRadius: tokenShape === 'cylinder' ? '18%' : '50%',
      display: 'grid',
      placeItems: 'center',
      transform: `translateZ(0) scale(${bright})`,
      transition: 'transform 220ms cubic-bezier(.2,.9,.3,1), box-shadow 220ms',
      cursor: 'pointer',
    };

    // token inner content depends on styleVariant (A-D)
    const tokenBaseStyle = (() => {
      if (styleVariant === 'A') {
        // glass with holo rim
        return {
          background: tokenFill(player.color),
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: `0 10px 20px rgba(2,6,8,0.5), inset 0 2px 6px rgba(255,255,255,0.06)`,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        };
      }
      if (styleVariant === 'B') {
        // cyber neon ring
        return {
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.12))',
          border: `2px solid ${hexToRgba(player.color, 0.6)}`,
          boxShadow: `0 8px 28px ${hexToRgba(player.color, 0.18)}, 0 2px 8px rgba(0,0,0,0.6)`,
        };
      }
      if (styleVariant === 'C') {
        // premium classic
        return {
          background: `radial-gradient(circle at 30% 20%, ${shade(player.color, 30)} 0%, ${shade(player.color, -6)} 70%)`,
          border: '1px solid rgba(0,0,0,0.18)',
          boxShadow: `0 6px 18px rgba(0,0,0,0.45)`,
        };
      }
      // D holographic
      return {
        background: tokenFill(player.color),
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: `0 14px 36px rgba(2,6,8,0.55), inset 0 6px 18px rgba(255,255,255,0.04)`,
        filter: 'saturate(1.08)'
      };
    })();

    // extra bright ring when selected/current-turn
    const extraRing = token.selected ? { boxShadow: `0 0 0 6px ${hexToRgba(player.color, 0.12)}` } : token.glowing ? { boxShadow: `0 0 0 10px ${hexToRgba(player.color, 0.18)}` } : turnPulse;

    return (
      <div
        onClick={() => onTokenClick(token.id)}
        title={`${token.player} token ${token.idx}`}
        style={{ ...common, ...tokenBaseStyle, ...extraRing }}
      >
        {/* inner glyph */}
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.12)" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M16.9 16.9l2.1 2.1M4.9 19.1l2.1-2.1M16.9 7.1l2.1-2.1" />
        </svg>
      </div>
    );
  }

  // helpers
  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');
    const num = parseInt(h, 16);
    const r = (num >> 16);
    const g = (num >> 8) & 0x00ff;
    const b = num & 0x0000ff;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // layout rendering
  return (
    <div style={{ minHeight: '100vh', background: layoutBg(styleVariant), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Controls */}
      <div style={{ width: '100%', maxWidth: 1200, display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <Select label="Style" value={styleVariant} options={["A","B","C","D"]} onChange={v=>setStyleVariant(v)} />
        <Select label="Token" value={tokenShape} options={["glass","disc","cylinder"]} onChange={v=>setTokenShape(v)} />
        <Select label="Color" value={colorVariant} options={["pure","neon","holo"]} onChange={v=>setColorVariant(v)} />
        <Select label="Board size" value={boardSizing} options={["fullscreen","80vw","fixed"]} onChange={v=>setBoardSizing(v)} />

        <button onClick={moveSelectedToken} style={btnStyle()}>Move Selected</button>
        <button onClick={() => setCurrentTurn(ct => (ct+1)%players.length)} style={btnStyle()}>Next Turn</button>
      </div>

      {/* Board container */}
      <div ref={boardRef} style={{ width: boardSize, height: boardSize, position: 'relative', borderRadius: 18, boxShadow: outerBoardShadow(styleVariant), transition: 'width .28s, height .28s' }}>
        {/* board background glass or neon depending on style */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden', background: boardInnerBg(styleVariant) }} />

        {/* grid cells */}
        {[...Array(15)].map((_, y) =>
          [...Array(15)].map((_, x) => (
            <div key={`${x}-${y}`} style={{ position: 'absolute', width: cell, height: cell, left: x*cell, top: y*cell, boxSizing: 'border-box', border: '1px solid rgba(0,0,0,0.06)' }} />
          ))
        )}

        {/* home quadrants (4) */}
        {/* Green */}
        <div style={{ position:'absolute', left:0, top:0, width: cell*6, height: cell*6, borderRadius:8, boxSizing:'border-box', border: '3px solid rgba(0,0,0,0.18)', background: quadrantBg('green', styleVariant) }} />
        {/* Yellow */}
        <div style={{ position:'absolute', left:cell*9, top:0, width: cell*6, height: cell*6, borderRadius:8, boxSizing:'border-box', border: '3px solid rgba(0,0,0,0.18)', background: quadrantBg('yellow', styleVariant) }} />
        {/* Red */}
        <div style={{ position:'absolute', left:0, top:cell*9, width: cell*6, height: cell*6, borderRadius:8, boxSizing:'border-box', border: '3px solid rgba(0,0,0,0.18)', background: quadrantBg('red', styleVariant) }} />
        {/* Blue */}
        <div style={{ position:'absolute', left:cell*9, top:cell*9, width: cell*6, height: cell*6, borderRadius:8, boxSizing:'border-box', border: '3px solid rgba(0,0,0,0.18)', background: quadrantBg('blue', styleVariant) }} />

        {/* outer paths (simplified colored lanes) */}
        {/* Red outer path */}
        {[...Array(6)].map((_, i) => (
          <Cell key={`r1-${i}`} x={6} y={i} color={styleColor('#ff4d6d', styleVariant)} />
        ))}
        {[...Array(6)].map((_, i) => (
          <Cell key={`r2-${i}`} x={6 + i} y={6} color={styleColor('#ff4d6d', styleVariant)} />
        ))}

        {/* Yellow outer path */}
        {[...Array(6)].map((_, i) => (
          <Cell key={`y1-${i}`} x={8 + i} y={6} color={styleColor('#ffd24a', styleVariant)} />
        ))}
        {[...Array(6)].map((_, i) => (
          <Cell key={`y2-${i}`} x={8} y={6 - i} color={styleColor('#ffd24a', styleVariant)} />
        ))}

        {/* Blue */}
        {[...Array(6)].map((_, i) => (
          <Cell key={`b1-${i}`} x={8} y={8 + i} color={styleColor('#4da6ff', styleVariant)} />
        ))}
        {[...Array(6)].map((_, i) => (
          <Cell key={`b2-${i}`} x={i} y={8} color={styleColor('#4da6ff', styleVariant)} />
        ))}

        {/* Green */}
        {[...Array(6)].map((_, i) => (
          <Cell key={`g1-${i}`} x={6 - i} y={8} color={styleColor('#17c964', styleVariant)} />
        ))}
        {[...Array(6)].map((_, i) => (
          <Cell key={`g2-${i}`} x={6} y={8 + i} color={styleColor('#17c964', styleVariant)} />
        ))}

        {/* safe stars */}
        {stars.map((s, i) => (
          <div key={`star-${i}`} style={{ position:'absolute', left: s.x*cell, top: s.y*cell, width: cell, height: cell, display:'grid', placeItems:'center' }}>
            <div style={{ fontSize: Math.max(10, cell*0.38), opacity: 0.95 }}>⭐</div>
          </div>
        ))}

        {/* center image square (keeps your earlier idea) */}
        <div style={{ position:'absolute', left: cell*6, top:cell*6, width: cell*3, height: cell*3, borderRadius: 12, overflow:'hidden', boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.02)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))' }}>
          {/* optionally show a fancy icon or pattern based on style */}
          <div style={{ position:'absolute', inset:0, background: centerPattern(styleVariant) }} />
        </div>

        {/* tokens rendered on top */}
        {tokens.map(tok => (
          <div key={tok.id} style={{ position: 'absolute', left: tok.pos.x * cell + (cell - cell*0.6)/2, top: tok.pos.y * cell + (cell - cell*0.6)/2, width: cell*0.6, height: cell*0.6, zIndex: 10 }}>
            <GlassToken token={tok} />
          </div>
        ))}

        {/* player turn indicators (small) */}
        <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 8 }}>
          {players.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: currentTurn === i ? hexToRgba(p.color, 0.12) : 'transparent', border: currentTurn === i ? `1px solid ${hexToRgba(p.color, 0.18)}` : '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: p.color, boxShadow: currentTurn === i ? `0 0 12px ${hexToRgba(p.color, 0.45)}` : 'none' }} />
              <div style={{ color: 'white', fontSize: 13, opacity: 0.9 }}>{p.id}</div>
            </div>
          ))}
        </div>

      </div>

      <div style={{ marginTop: 14, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Tip: click a token to select it → click "Move Selected" to demo the breath/extra glow animation.</div>
    </div>
  );
}

// --- small reusable components & styles ---
function Select({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 8, color: 'white' }}>
      <div style={{ fontSize: 13, opacity: 0.9 }}>{label}:</div>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function btnStyle() {
  return { padding: '8px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', color: 'white', cursor: 'pointer' };
}

function layoutBg(variant) {
  // background choices depending on variant
  if (variant === 'A') return 'linear-gradient(135deg, #0b0f12 0%, #071517 50%, #0b1b14 100%)';
  if (variant === 'B') return 'radial-gradient(circle at 10% 20%, #001219 0%, #020617 35%, #060012 100%)';
  if (variant === 'C') return 'linear-gradient(120deg, #071029, #081218)';
  return 'linear-gradient(120deg, #00111a, #04221a)';
}

function outerBoardShadow(variant) {
  if (variant === 'B') return '0 28px 120px rgba(60,140,255,0.06), inset 0 6px 20px rgba(0,0,0,0.6)';
  if (variant === 'C') return '0 20px 60px rgba(0,0,0,0.5)';
  return '0 24px 80px rgba(0,0,0,0.5)';
}

function boardInnerBg(variant) {
  if (variant === 'A') return 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))';
  if (variant === 'B') return 'linear-gradient(180deg, rgba(2,8,18,0.7), rgba(0,0,0,0.6))';
  if (variant === 'C') return 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.08))';
  return 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.08))';
}

function quadrantBg(name, variant) {
  const map = { green:'#17c964', yellow:'#ffd24a', red:'#ff4d6d', blue:'#4da6ff' };
  const base = map[name];
  if (variant === 'B') return `linear-gradient(180deg, ${hexToRgba(base,0.12)}, rgba(0,0,0,0.12))`;
  if (variant === 'C') return `linear-gradient(180deg, ${shade(base,18)}, ${shade(base,-6)})`;
  return `linear-gradient(180deg, ${hexToRgba(base,0.08)}, rgba(0,0,0,0.06))`;
}

function centerPattern(variant) {
  if (variant === 'B') return 'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.02) 0 8deg, rgba(255,255,255,0.00) 8deg 16deg)';
  if (variant === 'D') return 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.04), rgba(255,255,255,0.00) 30%), conic-gradient(from 120deg, rgba(255,255,255,0.02), rgba(255,0,200,0.02))';
  return 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04))';
}

function styleColor(hex, variant) {
  if (variant === 'B') return hexToRgba(hex, 0.12);
  return hexToRgba(hex, 0.18);
}

// attach utility functions used above inside the module scope
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const r = (num >> 16);
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  return `rgba(${r},${g},${b},${a})`;
}
function shade(hex, percent) {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  let r = (num >> 16) + Math.round(2.55 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(2.55 * percent);
  let b = (num & 0x0000ff) + Math.round(2.55 * percent);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}
