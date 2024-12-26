// lib/utils/token.ts
import { customAlphabet } from 'nanoid'

// Créer un alphabet personnalisé pour les tokens (lettres et chiffres)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32)

export const generateToken = (): string => {
  return nanoid()
}