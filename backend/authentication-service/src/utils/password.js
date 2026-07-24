const crypto = require("crypto");

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, KEY_LENGTH)
    .toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const expectedKey = Buffer.from(hash, "hex");

  if (expectedKey.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedKey, derivedKey);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
