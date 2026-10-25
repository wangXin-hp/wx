import type { JsonValue } from './types'

// 深度限制是最后一道保险：即使用户传入恶意或异常深的对象，也不能阻塞错误上报。
const MAX_SERIALIZATION_DEPTH = 20

/**
 * 把任意用户值转成 JSON 安全结构。这里不直接 JSON.stringify：它会因 BigInt、循环引用或
 * 抛错的 getter 中断整次上报，而监控 SDK 不应因为记录异常再次制造异常。
 */
export function safeSerialize(value: unknown): JsonValue {
  return visit(value, new WeakSet<object>(), 0)
}

function visit(value: unknown, ancestors: WeakSet<object>, depth: number): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : String(value)
  }

  // JSON.stringify 会静默删除 undefined、抛出 BigInt，并把 NaN 变成 null；监控数据需要保留
  // “这里确实存在一个特殊值”的事实，因此使用可读的占位字符串。
  if (typeof value === 'undefined') return '[undefined]'
  if (typeof value === 'bigint') return `${String(value)}n`
  if (typeof value === 'symbol') return value.description ? `Symbol(${value.description})` : 'Symbol()'
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`

  if (depth >= MAX_SERIALIZATION_DEPTH) return '[MaxDepth]'

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '[Invalid Date]' : value.toISOString()
  }

  if (value instanceof Error) {
    const serialized: Record<string, JsonValue> = {
      name: value.name || 'Error',
      message: value.message,
    }
    if (value.stack) serialized.stack = value.stack
    if (value.cause !== undefined) serialized.cause = visit(value.cause, ancestors, depth + 1)
    return serialized
  }

  if (typeof value !== 'object') return String(value)
  // WeakSet 只记录当前递归路径，而不是所有访问过的对象；共享引用不是循环引用。
  if (ancestors.has(value)) return '[Circular]'

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      return value.map((item) => visit(item, ancestors, depth + 1))
    }

    const result: Record<string, JsonValue> = {}
    for (const key of Object.keys(value)) {
      try {
        result[key] = visit((value as Record<string, unknown>)[key], ancestors, depth + 1)
      } catch (error) {
        result[key] = `[Thrown while reading property: ${readErrorMessage(error)}]`
      }
    }
    return result
  } finally {
    // 只标记当前递归路径。两个字段引用同一对象并不是循环，应该都能正常序列化。
    ancestors.delete(value)
  }
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
