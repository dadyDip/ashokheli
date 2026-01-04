"use client";

export default function Card({
  card,
  onClick,
  disabled,
  faceDown = false,   
  backImage = "/img/card-back.jpeg", 
}) {
  if (!card && !faceDown) return null;

  const SUIT_MAP = {
    hearts: { symbol: "♥", color: "#e53935" },
    diamonds: { symbol: "♦", color: "#e53935" },
    clubs: { symbol: "♣", color: "#111" },
    spades: { symbol: "♠", color: "#111" },
  };

  const suit = card ? SUIT_MAP[card.suit] : null;

  return (
    <div
      onClick={() => !disabled && !faceDown && onClick?.(card)}
      style={{
        width: 70,
        height: 100,
        borderRadius: 10,
        background: faceDown ? "#1e3a8a" : "#fff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        cursor: disabled || faceDown ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        position: "relative",
        userSelect: "none",
        overflow: "hidden",
        transition: "transform 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !faceDown)
          e.currentTarget.style.transform = "translateY(-6px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ================= CARD BACK ================= */}
      {faceDown && (
        <img
          src={backImage}
          alt="Card Back"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* ================= CARD FRONT ================= */}
      {!faceDown && (
        <>
          {/* Top-left */}
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              fontSize: 14,
              fontWeight: "bold",
              color: suit.color,
            }}
          >
            {card.value}
            <div style={{ fontSize: 12 }}>{suit.symbol}</div>
          </div>

          {/* Center */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 36,
              color: suit.color,
            }}
          >
            {suit.symbol}
          </div>

          {/* Bottom-right */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              fontSize: 14,
              fontWeight: "bold",
              color: suit.color,
              transform: "rotate(180deg)",
            }}
          >
            {card.value}
            <div style={{ fontSize: 12 }}>{suit.symbol}</div>
          </div>
        </>
      )}
    </div>
  );
}
