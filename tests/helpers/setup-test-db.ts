/**
 * Bootstrap test database: apply Prisma schema to test DB.
 *
 * Chạy trước test suite đầu tiên. Idempotent — re-run an toàn.
 *
 * Usage:
 *   npm run test:db:up      # start docker postgres
 *   npm run test:db:setup   # apply schema
 *   npm run test:integration
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load .env.test trước khi đọc DATABASE_URL
config({ path: '.env.test' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL không được set trong .env.test');
  process.exit(1);
}

if (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
  console.error('❌ Refusing to run on non-local DB:', process.env.DATABASE_URL);
  console.error('   Test sẽ XOÁ TOÀN BỘ DATA trong DB → chỉ cho phép local');
  process.exit(1);
}

console.log('🔧 Applying Prisma schema to test DB...');
console.log('   DATABASE_URL:', process.env.DATABASE_URL);

try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
  console.log('✅ Test DB ready');
} catch (err) {
  console.error('❌ Failed to apply schema:', err);
  process.exit(1);
}
