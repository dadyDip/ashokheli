// server/casino-games/jili/crypto.js
import crypto from "crypto";

export function encryptPayloadECB(data, key) {
  if (key.length !== 32) throw new Error("JILI SECRET KEY must be 32 characters");

  const jsonData = JSON.stringify(data);
  const cipher = crypto.createCipheriv("aes-256-ecb", Buffer.from(key), null);
  let encrypted = cipher.update(jsonData, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export function encryptPayload(payload, secretKey) {
  if (secretKey.length !== 32) throw new Error("Secret key must be 32 characters");
  const json = JSON.stringify(payload);
  const cipher = crypto.createCipheriv("aes-256-ecb", Buffer.from(secretKey), null);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(json, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}
