const sequelize = require('../config/database');

// ============================================================
// UP migration — case financial management schema
// ------------------------------------------------------------
// NOTE: This migration is OPT-IN and idempotent. It is NOT run
// automatically at server startup unless APPLY_FINANCIAL_MIGRATIONS=true.
//
// Old Invoice.status ENUM values and their meaning (evidence):
//   - 'pending'    default on creation; invoice immediately issued to the
//                  client (old createInvoice always sent the email).
//                  Partial payments did NOT change status (stayed 'pending').
//   - 'paid'       set when paidAmount >= totalAmount.
//   - 'overdue'    set by the overdue checker for 'pending' past dueDate.
//   - 'cancelled'  cancelled by a user.
//
// Safe value-based mapping (preserves partial-payment information):
//   pending + paidAmount >= totalAmount          -> paid
//   pending + 0 < paidAmount < totalAmount       -> partially_paid
//   pending + paidAmount <= 0                    -> sent
//   paid / overdue / cancelled                   -> unchanged
//   (no old invoice can be a 'draft' — the draft state is new)
// ============================================================

const upMigrations = [
  // Invoice model - status ENUM -> VARCHAR (safe value-based mapping below)
  `DO $$ BEGIN
    ALTER TABLE "Invoices" ALTER COLUMN "status" TYPE VARCHAR(20);
  EXCEPTION WHEN undefined_column THEN NULL;
  END $$;`,
  `ALTER TABLE "Invoices" ALTER COLUMN "status" SET DEFAULT 'draft';`,
  `UPDATE "Invoices" SET "status" = 'paid' WHERE "status" = 'pending' AND "paidAmount" >= "totalAmount";`,
  `UPDATE "Invoices" SET "status" = 'partially_paid' WHERE "status" = 'pending' AND "paidAmount" > 0 AND "paidAmount" < "totalAmount";`,
  `UPDATE "Invoices" SET "status" = 'sent' WHERE "status" = 'pending' AND "paidAmount" <= 0;`,
  // Sanity check: any remaining 'pending' rows (should be none) become 'sent'
  `UPDATE "Invoices" SET "status" = 'sent' WHERE "status" = 'pending';`,

  // Payment model - invoiceId nullable, add caseId/clientId, add knet payment method
  `DO $$ BEGIN
    ALTER TABLE "Payments" ALTER COLUMN "invoiceId" DROP NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END $$;`,
  `ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "caseId" INTEGER;`,
  `ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "clientId" INTEGER;`,
  `DO $$ BEGIN
    ALTER TABLE "Payments" ALTER COLUMN "paymentMethod" TYPE VARCHAR(20);
  EXCEPTION WHEN undefined_column THEN NULL;
  END $$;`,
  `ALTER TABLE "Payments" ALTER COLUMN "paymentMethod" SET DEFAULT 'cash';`,

  // FinancialEntry table
  `CREATE TABLE IF NOT EXISTS "FinancialEntries" (
    "id" SERIAL PRIMARY KEY,
    "type" VARCHAR(20) NOT NULL,
    "caseId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    "clientId" INTEGER,
    "category" VARCHAR(60) NOT NULL,
    "description" VARCHAR(300),
    "amount" DECIMAL(10,3) NOT NULL,
    "entryDate" DATE DEFAULT CURRENT_DATE,
    "billable" BOOLEAN DEFAULT TRUE,
    "billingStatus" VARCHAR(20) DEFAULT 'unbilled',
    "paidBy" VARCHAR(20),
    "receiptUrl" VARCHAR(500),
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS "FinancialEntries_caseId_idx" ON "FinancialEntries" ("caseId");`,
  `CREATE INDEX IF NOT EXISTS "FinancialEntries_sessionId_idx" ON "FinancialEntries" ("sessionId");`,
  `CREATE INDEX IF NOT EXISTS "FinancialEntries_billingStatus_idx" ON "FinancialEntries" ("billingStatus");`,

  // CaseFeeAgreement table
  `CREATE TABLE IF NOT EXISTS "CaseFeeAgreements" (
    "id" SERIAL PRIMARY KEY,
    "caseId" INTEGER NOT NULL UNIQUE,
    "feeArrangement" VARCHAR(30) NOT NULL DEFAULT 'fixed_fee',
    "agreedAmount" DECIMAL(10,3) DEFAULT 0,
    "currency" VARCHAR(10) DEFAULT 'KWD',
    "startDate" DATE,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,

  // InvoiceLine table + duplicate-invoicing partial unique index
  `CREATE TABLE IF NOT EXISTS "InvoiceLines" (
    "id" SERIAL PRIMARY KEY,
    "invoiceId" INTEGER NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "unitPrice" DECIMAL(10,3) NOT NULL,
    "amount" DECIMAL(10,3) NOT NULL,
    "sourceType" VARCHAR(20),
    "sourceId" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS "InvoiceLines_invoiceId_idx" ON "InvoiceLines" ("invoiceId");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_invoice_line_source" ON "InvoiceLines" ("sourceType", "sourceId") WHERE "sourceId" IS NOT NULL;`,
];

// ============================================================
// DOWN migration — restores the previous schema
// ------------------------------------------------------------
// Status mapping back to the old ENUM('pending','paid','overdue','cancelled'):
//   draft          -> pending (rollback has no draft concept; documented loss)
//   sent           -> pending
//   partially_paid -> pending (partial flag is recoverable from paidAmount)
//   paid           -> paid
//   overdue        -> overdue
//   cancelled      -> cancelled
// Monetary data (totalAmount/paidAmount) is preserved. The draft /
// partially_paid distinctions are not representable in the old ENUM, so they
// collapse to 'pending' on rollback. No payment rows are deleted.
// ============================================================

const downMigrations = [
  `UPDATE "Invoices" SET "status" = 'pending' WHERE "status" IN ('draft', 'sent', 'partially_paid');`,
  // Restore the original inline ENUM('pending','paid','overdue','cancelled').
  // Postgres names inline enum types as "enum_<table>_<column>".
  `DO $$ BEGIN
    ALTER TABLE "Invoices" ALTER COLUMN "status" DROP DEFAULT;
  EXCEPTION WHEN others THEN NULL;
  END $$;`,
  `DO $$
  DECLARE tname text;
  BEGIN
    SELECT typname INTO tname FROM pg_type WHERE typname = 'enum_Invoices_status';
    IF tname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE "Invoices" ALTER COLUMN "status" TYPE %I USING "status"::text::%I', tname, tname);
    END IF;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Invoices" ALTER COLUMN "status" SET DEFAULT 'pending';
  EXCEPTION WHEN others THEN NULL;
  END $$;`,
  `DROP TABLE IF EXISTS "InvoiceLines";`,
  `DROP TABLE IF EXISTS "CaseFeeAgreements";`,
  `DROP TABLE IF EXISTS "FinancialEntries";`,
  // Payment.paymentMethod: map new 'knet' into old enum, then restore inline ENUM('cash','bank_transfer','check','credit_card','other')
  `UPDATE "Payments" SET "paymentMethod" = 'other' WHERE "paymentMethod" = 'knet';`,
  `DO $$ BEGIN
    ALTER TABLE "Payments" ALTER COLUMN "paymentMethod" DROP DEFAULT;
  EXCEPTION WHEN others THEN NULL;
  END $$;`,
  `DO $$
  DECLARE tname text;
  BEGIN
    SELECT typname INTO tname FROM pg_type WHERE typname = 'enum_Payments_paymentMethod';
    IF tname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE "Payments" ALTER COLUMN "paymentMethod" TYPE %I USING "paymentMethod"::text::%I', tname, tname);
    END IF;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Payments" ALTER COLUMN "paymentMethod" SET DEFAULT 'cash';
  EXCEPTION WHEN others THEN NULL;
  END $$;`,
  `ALTER TABLE "Payments" DROP COLUMN IF EXISTS "clientId";`,
  `ALTER TABLE "Payments" DROP COLUMN IF EXISTS "caseId";`,
  `DO $$ BEGIN
    ALTER TABLE "Payments" ALTER COLUMN "invoiceId" SET NOT NULL;
  EXCEPTION WHEN others THEN NULL;
  END $$;`,
];

const runMigrations = async () => {
  try {
    for (const sql of upMigrations) {
      try {
        await sequelize.query(sql);
        console.log('✅ Financials migration applied');
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate column')) {
          console.log('⏭️ Financials migration: already applied, skipping');
        } else {
          console.warn('⚠️ Financials migration warning:', err.message);
        }
      }
    }
    console.log('✅ All financials migrations completed');
  } catch (error) {
    console.error('❌ Financials migration error:', error.message);
  }
};

const rollbackMigrations = async () => {
  try {
    for (const sql of downMigrations) {
      try {
        await sequelize.query(sql);
        console.log('✅ Financials rollback applied');
      } catch (err) {
        console.warn('⚠️ Financials rollback warning:', err.message);
      }
    }
    console.log('✅ All financials rollbacks completed');
  } catch (error) {
    console.error('❌ Financials rollback error:', error.message);
  }
};

module.exports = runMigrations;
module.exports.rollbackMigrations = rollbackMigrations;
