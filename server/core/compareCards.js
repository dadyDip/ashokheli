import { rank } from "./deck.js";

/**
 * Compare two cards with lead suit and trump
 * @param {string} lead - lead suit
 * @param {object} a - first card { suit, value }
 * @param {object} b - second card { suit, value }
 * @param {string} trump - trump suit (optional)
 * @returns {number} - >0 if a wins, <0 if b wins
 */
export function compareCards(lead, a, b, trump) {
  // Trump beats non-trump
  if (trump && a.suit !== b.suit) {
    if (a.suit === trump) return 1;
    if (b.suit === trump) return -1;
  }

  // Same suit → compare rank (A > K > Q > J ...)
  if (a.suit === b.suit) {
    return rank(a.value) - rank(b.value);
  }

  // Follow lead suit
  if (a.suit === lead) return 1;
  if (b.suit === lead) return -1;

  // Otherwise first card loses
  return -1;
}
