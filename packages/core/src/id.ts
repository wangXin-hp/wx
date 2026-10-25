import type { IdFactory } from './types'

type CryptoLike = {
  randomUUID?: () => string
  getRandomValues?: (array: Uint8Array) => Uint8Array
}

/**
 * ID 只承担唯一身份而非鉴权；优先使用运行时 UUID，极旧环境才回退到随机字符串。
 * 生产环境的去重边界仍由服务端数据库/存储约束负责，客户端 ID 不能当作安全凭证。
 */
export const defaultIdFactory: IdFactory = () => {
  const crypto = (globalThis as { crypto?: CryptoLike }).crypto
  if (crypto?.randomUUID) return crypto.randomUUID()

  if (crypto?.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}
