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

export function debug(message: string, ...args: unknown[]): void {
  log('debug', message, ...args);
}

export function info(message: string, ...args: unknown[]): void {
  log('info', message, ...args);
}

export function warn(message: string, ...args: unknown[]): void {
  log('warn', message, ...args);
}

export function error(message: string, ...args: unknown[]): void {
  log('error', message, ...args);
}
