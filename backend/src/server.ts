import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 Mini ERP + CRM Server running in [${ENV.NODE_ENV}] mode on port ${ENV.PORT}`);
  console.log(`📡 REST API available at: http://localhost:${ENV.PORT}/api`);
  console.log(`🩺 Health check: http://localhost:${ENV.PORT}/api/health`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('🔒 Closed active HTTP server.');
    try {
      await prisma.$disconnect();
      console.log('🗄️ Disconnected Prisma database client.');
      process.exit(0);
    } catch (err) {
      console.error('Error during disconnect:', err);
      process.exit(1);
    }
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
