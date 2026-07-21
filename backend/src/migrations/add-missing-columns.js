const sequelize = require('../config/database');

const migrations = [
  // Case model - new fields
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "assignmentDate" DATE;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "assignmentEndDate" DATE;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "filingType" VARCHAR(20) DEFAULT 'new';`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "lastEditedBy" INTEGER;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "lastEditedAt" TIMESTAMP;`,

  // Client model - passportNumber
  `ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "passportNumber" VARCHAR(30);`,

  // Transaction model - new government transaction fields
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "title" VARCHAR(200);`,
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "governmentEntity" VARCHAR(200);`,
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "entityType" VARCHAR(50) DEFAULT 'other';`,
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "submissionDate" DATE;`,
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "expectedDate" DATE;`,
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "completionDate" DATE;`,
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "createdBy" INTEGER;`,
  `ALTER TABLE "Transactions" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,

  // Session model - sessionType
  `ALTER TABLE "Sessions" ADD COLUMN IF NOT EXISTS "sessionType" VARCHAR(30) DEFAULT 'mainSession';`,
];

const runMigrations = async () => {
  try {
    for (const sql of migrations) {
      try {
        await sequelize.query(sql);
        console.log('✅ Migration applied');
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate column')) {
          console.log('⏭️ Column already exists, skipping');
        } else {
          console.warn('⚠️ Migration warning:', err.message);
        }
      }
    }
    console.log('✅ All migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
};

module.exports = runMigrations;
