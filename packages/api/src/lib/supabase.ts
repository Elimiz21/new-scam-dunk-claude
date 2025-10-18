import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import logger from './logger';

// Initialize Supabase client with service role permissions
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey.replace(/[\s\n\r]+/g, ''), {
  auth: { persistSession: false },
});

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle Prisma connection events
prisma
  .$connect()
  .then(() => {
    logger.info('Connected to Supabase PostgreSQL via Prisma');
  })
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Failed to connect to database');
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
