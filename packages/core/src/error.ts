import { safeSerialize } from './serialization'
import type { ErrorPayload } from './types'

/**
 * 浏览器的 Promise rejection reason 可以是 Error、字符串，甚至任意对象。
 * 统一成稳定结构后，后端无需为每种 JavaScript 抛出方式维护一套解析逻辑。
 * 注意：这里不把未知对象强行断言成 Error，因为 `throw { message: 'x' }` 在 JavaScript 中完全合法。
 */
export function normalizeError(error: unknown): ErrorPayload {
  if (error instanceof Error) {
    const payload: ErrorPayload = {
      name: error.name || 'Error',
      message: error.message || error.name || 'Unknown error',
    }
    if (error.stack) payload.stack = error.stack
    if (error.cause !== undefined) payload.cause = safeSerialize(error.cause)
    return payload
  }

  if (typeof error === 'string') {
    return { name: 'Error', message: error }
  }

  if (isRecord(error)) {
    return {
      name: readString(error, 'name') ?? 'NonErrorException',
      message: readString(error, 'message') ?? 'Non-Error value was thrown',
      details: safeSerialize(error),
    }
  }

  return {
    name: 'NonErrorException',
    message: String(error),
    details: safeSerialize(error),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  try {
    const value = record[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  } catch {
    return undefined
  }
}
