import pino from 'pino';
import { config } from './config';

const transport = process.env.NODE_ENV === 'production'
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    } as const;

export const logger = pino({ level: config.logLevel, transport });

export default logger;
