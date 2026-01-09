"use client";

export default function Card({
  card,
  disabled,
  faceDown = false,
  onClick,
  clickable = false,
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
      className={`relative rounded-lg shadow-lg select-none cursor-pointer`}
      style={{
        width: 70,
        height: 100,
        background: faceDown ? "#1e3a8a" : "#fff",
      }}
      onClick={disabled || !clickable ? undefined : onClick}
    >
      {faceDown ? (
        <img
          src={backImage}
          alt="Card Back"
          className="w-full h-full object-cover rounded-lg"
          draggable={false}
        />
      ) : (
        <>
          <div
            className="absolute top-1.5 left-1.5 text-sm font-bold"
            style={{ color: suit.color }}
          >
            {card.value}
            <div className="text-xs">{suit.symbol}</div>
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center text-4xl"
            style={{ color: suit.color }}
          >
            {suit.symbol}
          </div>

          <div
            className="absolute bottom-1.5 right-1.5 text-sm font-bold rotate-180"
            style={{ color: suit.color }}
          >
            {card.value}
            <div className="text-xs">{suit.symbol}</div>
          </div>
        </>
      )}
    </div>
  );
}
