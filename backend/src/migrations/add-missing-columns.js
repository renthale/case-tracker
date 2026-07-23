const sequelize = require('../config/database');

const migrations = [
  // Case model - new fields
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "assignmentDate" DATE;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "assignmentEndDate" DATE;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "filingType" VARCHAR(20) DEFAULT 'new';`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "lastEditedBy" INTEGER;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "lastEditedAt" TIMESTAMP;`,

  // Client model - passportNumber + dateOfBirth + firstCooperationDate
  `ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "passportNumber" VARCHAR(30);`,
  `ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE;`,
  `ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "firstCooperationDate" DATE;`,

  // Transaction model - fix old ENUM 'type' column to VARCHAR
  `DO $$ BEGIN
    ALTER TABLE "Transactions" ALTER COLUMN "type" TYPE VARCHAR(50);
  EXCEPTION WHEN undefined_column THEN NULL;
  END $$;`,
  `ALTER TABLE "Transactions" ALTER COLUMN "type" SET DEFAULT 'government_transaction';`,
  `DO $$ BEGIN
    ALTER TABLE "Transactions" ALTER COLUMN "status" TYPE VARCHAR(30);
  EXCEPTION WHEN undefined_column THEN NULL;
  END $$;`,

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

  // Case model - fee breakdown + registration + payment status
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "registrationNumber" VARCHAR(50);`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "consultationFees" DECIMAL(10,3) DEFAULT 0;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "litigationFees" DECIMAL(10,3) DEFAULT 0;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "sessionFees" DECIMAL(10,3) DEFAULT 0;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "otherFees" DECIMAL(10,3) DEFAULT 0;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "paymentStatus" VARCHAR(20) DEFAULT 'unpaid';`,

  // LegalDocument model - review and approval dates
  `ALTER TABLE "LegalDocuments" ADD COLUMN IF NOT EXISTS "reviewDate" DATE;`,
  `ALTER TABLE "LegalDocuments" ADD COLUMN IF NOT EXISTS "approvedBy" INTEGER;`,
  `ALTER TABLE "LegalDocuments" ADD COLUMN IF NOT EXISTS "approvalDate" DATE;`,

  // Session model - postponedTo for court agent
  `ALTER TABLE "Sessions" ADD COLUMN IF NOT EXISTS "postponedTo" DATE;`,

  // Case model - court agent + secondary lawyer FK columns
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "courtAgentId" INTEGER;`,
  `ALTER TABLE "Cases" ADD COLUMN IF NOT EXISTS "secondaryLawyerId" INTEGER;`,
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
