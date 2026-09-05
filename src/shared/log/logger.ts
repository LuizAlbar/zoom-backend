import util from 'node:util';
import { env } from '../env/index.js';

function formatArgs(args: any[]): any[] {
  return args.map((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      return util.inspect(arg, { depth: null, colors: true });
    }
    return arg;
  });
}

export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, ...formatArgs(args));
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, ...formatArgs(args));
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, ...formatArgs(args));
  },
  debug: (msg: string, ...args: any[]) => {
    if (env.NODE_ENV === 'dev') {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${msg}`, ...formatArgs(args));
    }
  },
  trace: (msg: string, ...args: any[]) => {
    if (env.NODE_ENV === 'dev') {
      console.log(`[TRACE] [${new Date().toISOString()}] ${msg}`, ...formatArgs(args));
    }
  }
};
