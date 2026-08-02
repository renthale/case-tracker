const sequelize = require('../config/database');

const statements = [
  `ALTER TABLE "ClientPortalUsers" ADD COLUMN IF NOT EXISTS "invitationToken" VARCHAR(500);`,
  `ALTER TABLE "ClientPortalUsers" ADD COLUMN IF NOT EXISTS "invitationTokenExpiry" TIMESTAMP;`,
  `ALTER TABLE "ClientPortalUsers" ADD COLUMN IF NOT EXISTS "invitationSentAt" TIMESTAMP;`,
  `ALTER TABLE "ClientPortalUsers" ADD COLUMN IF NOT EXISTS "passwordResetToken" VARCHAR(500);`,
  `ALTER TABLE "ClientPortalUsers" ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiry" TIMESTAMP;`,
  `ALTER TABLE "ClientPortalUsers" ALTER COLUMN "password" DROP NOT NULL;`
];

const runMigrations = async () => {
  try {
    for (const statement of statements) {
      try {
        await sequelize.query(statement);
      } catch (err) {
        console.warn('⚠️ Portal migration warning:', err.message);
      }
    }
    console.log('✅ Portal invitation migrations completed');
  } catch (error) {
    console.error('❌ Portal migration error:', error.message);
  }
};

module.exports = runMigrations;
