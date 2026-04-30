/** Her tarayıcı modülü için üst süre (ms) */
export const SCANNER_TIMEOUT_MS = 8000;

export function isTimeoutError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return e.message === "timeout" || e.message.endsWith(":timeout");
}

/**
 * Modül süresini sınırlar; süre aşımında `new Error("timeout")` fırlatır.
 */
export function withTimeout<T>(promise: Promise<T>, ms = SCANNER_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}
