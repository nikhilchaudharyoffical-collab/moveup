import crypto from "node:crypto";

export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

