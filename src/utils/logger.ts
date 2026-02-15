type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const activeLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

export function log(level: LogLevel, message: string, ...args: unknown[]): void {
  if (levelPriority[level] < levelPriority[activeLevel]) {
    return;
  }

  console[level](`[lumos] ${message}`, ...args);
}
