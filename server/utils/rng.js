export function randomFloat(min = 0, max = 1) {
  return Math.random() * (max - min) + min
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
