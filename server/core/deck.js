/* ===================== DECK UTILITIES ===================== */

export const SUITS = ["hearts", "diamonds", "clubs", "spades"];
export const VALUES = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

export const rank = v => VALUES.indexOf(v);

export function createDeck() {
  return SUITS.flatMap(s => VALUES.map(v => ({ suit: s, value: v })));
}

export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

export function deal(deck, order, count = 13) {
  const hands = {};
  order.forEach(pid => {
    hands[pid] = deck.splice(0, count);
  });
  return hands;
}
