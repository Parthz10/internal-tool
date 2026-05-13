import crypto from "crypto"

const algorithm = "aes-256-gcm"
const ivLength = 12

function getKey(): Buffer {
  const key = process.env.DATA_ENCRYPTION_KEY
  if (!key) {
    throw new Error("DATA_ENCRYPTION_KEY must be set")
  }
  if (/^[a-f0-9]{64}$/i.test(key)) {
    return Buffer.from(key, "hex")
  }
  if (Buffer.byteLength(key, "utf8") === 32) {
    return Buffer.from(key, "utf8")
  }
  throw new Error("DATA_ENCRYPTION_KEY must be a 64-character hex key or a 32-byte secret")
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(ivLength)
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(".")
}

export function decrypt(ciphertext: string): string {
  const [ivEncoded, tagEncoded, encryptedEncoded] = ciphertext.split(".")
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw new Error("Invalid encrypted payload")
  }
  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(ivEncoded, "base64url"))
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64url")),
    decipher.final()
  ]).toString("utf8")
}
