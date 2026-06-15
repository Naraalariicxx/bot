function fmt(obj: unknown, msg?: string): string {
  const base = typeof obj === "string" ? { msg: obj } : { ...(obj as object), msg };
  return JSON.stringify({ time: new Date().toISOString(), ...base });
}

export const logger = {
  info:  (obj: unknown, msg?: string) => console.log(fmt(obj, msg)),
  warn:  (obj: unknown, msg?: string) => console.warn(fmt(obj, msg)),
  error: (obj: unknown, msg?: string) => console.error(fmt(obj, msg)),
};
