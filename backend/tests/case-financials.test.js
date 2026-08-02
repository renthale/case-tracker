/*
 * Backend verification tests for the Case Financials feature.
 *
 * Requires an ISOLATED Postgres database — NEVER point this at production.
 *
 *   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/case_tracker_test \
 *   DB_SSL=false \
 *   node --test tests/
 *
 * The test DB schema is created with sequelize.sync({ force: true }) on start,
 * which DROPS all tables in the target database.
 */
process.env.JWT_SECRET = 'case-tracker-test-secret';
process.env.APPLY_FINANCIAL_MIGRATIONS = 'false';
process.env.SEED_PORTAL_USERS = 'false';
process.env.PORTAL_URL = 'http://localhost:3000/#/portal';

const TEST_DB = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!TEST_DB) {
  console.error('❌ TEST_DATABASE_URL is required (point it at an isolated Postgres DB).');
  process.exit(1);
}
process.env.DATABASE_URL = TEST_DB;

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const sequelize = require('../src/config/database');
const {
  User, Client, Case, Session, Invoice, Payment,
  FinancialEntry, CaseFeeAgreement, ClientPortalUser, Notification
} = require('../src/models');

const caseRoutes = require('../src/routes/caseRoutes');
const invoiceRoutes = require('../src/routes/invoiceRoutes');
const paymentRoutes = require('../src/routes/paymentRoutes');
const financialRoutes = require('../src/routes/financialRoutes');
const clientPortalRoutes = require('../src/routes/clientPortalRoutes');
const errorHandler = require('../src/middleware/errorHandler');

const buildApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/api/cases', caseRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/financial-entries', financialRoutes);
  app.use('/api/portal', clientPortalRoutes);
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.use(errorHandler);
  return app;
};

let server;
let base;
let adminToken;
let lawyerToken;
let admin;
let lawyer;
let client;
let caseA;
let caseB;
let sessionA;
let feeEntry;
let expenseEntry;
let sessionExpenseEntry;
let nonBillableEntry;

const tokenFor = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const api = async (method, path, body, token, headers = {}) => {
  const opts = { method, headers: { ...headers } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${base}${path}`, opts);
  let json = null;
  try { json = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, json };
};

before(async () => {
  await sequelize.sync({ force: true });

  admin = await User.create({ username: 'admin', email: 'admin@test.kw', password: 'Admin@123', fullName: 'Admin User', role: 'admin' });
  const lawyer = await User.create({ username: 'lawyer', email: 'lawyer@test.kw', password: 'Lawyer@123', fullName: 'Lawyer User', role: 'lawyer' });
  adminToken = tokenFor(admin);
  lawyerToken = tokenFor(lawyer);

  client = await Client.create({ name: 'Test Client', email: 'client@test.kw', civilId: 'TEST0001' });

  caseA = await Case.create({ caseNumber: 'C-100', title: 'Case A', type: 'civil', clientId: client.id, assignedLawyerId: lawyer.id, consultationFees: 0, litigationFees: 0, sessionFees: 0, otherFees: 0 });
  caseB = await Case.create({ caseNumber: 'C-200', title: 'Case B', type: 'commercial', clientId: client.id, assignedLawyerId: lawyer.id, consultationFees: 0, litigationFees: 0, sessionFees: 0, otherFees: 0 });

  sessionA = await Session.create({ caseId: caseA.id, sessionNumber: 1, date: new Date(), status: 'completed' });

  feeEntry = await FinancialEntry.create({ type: 'professional_fee', caseId: caseA.id, clientId: client.id, category: 'consultation', amount: 100.5, billable: true, billingStatus: 'unbilled' });
  expenseEntry = await FinancialEntry.create({ type: 'case_expense', caseId: caseA.id, clientId: client.id, category: 'court_filing_fee', amount: 25.25, billable: true, billingStatus: 'unbilled' });
  sessionExpenseEntry = await FinancialEntry.create({ type: 'session_expense', caseId: caseA.id, sessionId: sessionA.id, clientId: client.id, category: 'court_agent_fee', amount: 10, billable: true, billingStatus: 'unbilled' });
  nonBillableEntry = await FinancialEntry.create({ type: 'professional_fee', caseId: caseA.id, clientId: client.id, category: 'consultation', amount: 999, billable: false, billingStatus: 'unbilled' });

  const app = buildApp();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (process.env.TEAR_DOWN === '1') {
    await sequelize.getQueryInterface().dropAllTables();
  }
  await sequelize.close();
});

test('health endpoint responds', async () => {
  const { status, json } = await api('GET', '/api/health');
  assert.strictEqual(status, 200);
  assert.strictEqual(json.status, 'ok');
});

test('unauthenticated financial endpoints are rejected (401)', async () => {
  for (const path of ['/api/invoices', '/api/payments', '/api/financial-entries', `/api/cases/${caseA.id}/financials`]) {
    const { status } = await api('GET', path);
    assert.strictEqual(status, 401, `${path} should be 401`);
  }
});

test('non-financial roles are rejected with 403', async () => {
  const getInv = await api('GET', '/api/invoices', undefined, lawyerToken);
  assert.strictEqual(getInv.status, 403);
  const getFin = await api('GET', `/api/cases/${caseA.id}/financials`, undefined, lawyerToken);
  assert.strictEqual(getFin.status, 403);
  const postEntry = await api('POST', '/api/financial-entries', { type: 'professional_fee', caseId: caseA.id, amount: 5, category: 'consultation' }, lawyerToken);
  assert.strictEqual(postEntry.status, 403);
});

test('create professional fee entry', async () => {
  const { status, json } = await api('POST', '/api/financial-entries', {
    type: 'professional_fee', caseId: caseA.id, amount: 50.125, category: 'consultation', description: 'advice'
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(parseFloat(json.entry.amount), 50.125);
  assert.strictEqual(json.entry.billingStatus, 'unbilled');
});

test('create case expense entry with rounding to 3 decimals', async () => {
  const { status, json } = await api('POST', '/api/financial-entries', {
    type: 'case_expense', caseId: caseA.id, amount: 0.1, category: 'court_stamp'
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(parseFloat(json.entry.amount), 0.1);
});

test('create session expense entry with a valid session', async () => {
  const { status, json } = await api('POST', '/api/financial-entries', {
    type: 'session_expense', caseId: caseA.id, sessionId: sessionA.id, amount: 7.5, category: 'transportation'
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(json.entry.sessionId, sessionA.id);
});

test('session mismatch is rejected', async () => {
  const foreignSession = await Session.create({ caseId: caseB.id, sessionNumber: 1, date: new Date(), status: 'completed' });
  const { status, json } = await api('POST', '/api/financial-entries', {
    type: 'session_expense', caseId: caseA.id, sessionId: foreignSession.id, amount: 5, category: 'transportation'
  }, adminToken);
  assert.strictEqual(status, 400);
  await foreignSession.destroy();
});

test('session expense without a session is rejected', async () => {
  const { status } = await api('POST', '/api/financial-entries', {
    type: 'session_expense', caseId: caseA.id, amount: 5, category: 'transportation'
  }, adminToken);
  assert.strictEqual(status, 400);
});

test('unbilled items endpoint returns billable unbilled entries', async () => {
  const { status, json } = await api('GET', `/api/cases/${caseA.id}/unbilled-items`, undefined, adminToken);
  assert.strictEqual(status, 200);
  const ids = json.entries.map((e) => e.id);
  assert.ok(ids.includes(feeEntry.id));
  assert.ok(ids.includes(expenseEntry.id));
  assert.ok(ids.includes(sessionExpenseEntry.id));
  assert.ok(!ids.includes(nonBillableEntry.id), 'non-billable entries must not be unbilled items');
  assert.ok(json.entries.every((e) => e.billable && e.billingStatus === 'unbilled'));
});

test('create a draft invoice links entries and marks them invoiced', async () => {
  const { status, json } = await api('POST', '/api/invoices', {
    clientId: client.id, caseId: caseA.id, status: 'draft', totalAmount: 100.5,
    lines: [{ description: 'Consultation', amount: 100.5, sourceType: 'professional_fee', sourceId: feeEntry.id }]
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(json.invoice.status, 'draft');
  assert.strictEqual(parseFloat(json.invoice.paidAmount), 0);

  const updated = await FinancialEntry.findByPk(feeEntry.id);
  assert.strictEqual(updated.billingStatus, 'invoiced');
});

test('duplicate-invoice prevention rejects an already-linked entry', async () => {
  const { status } = await api('POST', '/api/invoices', {
    clientId: client.id, caseId: caseA.id, status: 'draft', totalAmount: 50,
    lines: [{ description: 'Double billing', amount: 50, sourceType: 'professional_fee', sourceId: feeEntry.id }]
  }, adminToken);
  assert.strictEqual(status, 400);
});

test('create a sent invoice (email is skipped when SMTP_PASS is unset)', async () => {
  const { status, json } = await api('POST', '/api/invoices', {
    clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 25.25,
    lines: [{ description: 'Filing fee', amount: 25.25, sourceType: 'case_expense', sourceId: expenseEntry.id }]
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(json.invoice.status, 'sent');
});

test('partial payment moves invoice to partially_paid', async () => {
  const invoice = await Invoice.create({ invoiceNumber: 'INV-TEST-PART', clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 100, paidAmount: 0, type: 'case_fees' });
  const { status, json } = await api('POST', `/api/payments/invoice/${invoice.id}`, {
    amount: 40, paymentDate: '2026-08-01', paymentMethod: 'cash'
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(json.invoice.status, 'partially_paid');
  assert.strictEqual(parseFloat(json.invoice.paidAmount), 40);
});

test('full payment marks invoice paid and entries paid', async () => {
  const fee2 = await FinancialEntry.create({ type: 'professional_fee', caseId: caseA.id, clientId: client.id, category: 'consultation', amount: 60, billable: true, billingStatus: 'invoiced' });
  const invoice = await Invoice.create({ invoiceNumber: 'INV-TEST-FULL', clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 60, paidAmount: 0, type: 'case_fees' });
  const { InvoiceLine } = require('../src/models');
  await InvoiceLine.create({ invoiceId: invoice.id, description: 'x', amount: 60, sourceType: 'professional_fee', sourceId: fee2.id });
  const { status, json } = await api('POST', `/api/payments/invoice/${invoice.id}`, {
    amount: 60, paymentDate: '2026-08-01', paymentMethod: 'bank_transfer'
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(json.invoice.status, 'paid');
  assert.strictEqual(parseFloat(json.invoice.paidAmount), 60);
  const updated = await FinancialEntry.findByPk(fee2.id);
  assert.strictEqual(updated.billingStatus, 'paid');
});

test('overpayment is rejected', async () => {
  const invoice = await Invoice.create({ invoiceNumber: 'INV-TEST-OVER', clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 10, paidAmount: 0, type: 'case_fees' });
  const { status } = await api('POST', `/api/payments/invoice/${invoice.id}`, {
    amount: 11, paymentDate: '2026-08-01', paymentMethod: 'cash'
  }, adminToken);
  assert.strictEqual(status, 400);
});

test('payment on a draft invoice is rejected', async () => {
  const invoice = await Invoice.create({ invoiceNumber: 'INV-TEST-DRAFT', clientId: client.id, caseId: caseA.id, status: 'draft', totalAmount: 10, paidAmount: 0, type: 'case_fees' });
  const { status } = await api('POST', `/api/payments/invoice/${invoice.id}`, {
    amount: 5, paymentDate: '2026-08-01', paymentMethod: 'cash'
  }, adminToken);
  assert.strictEqual(status, 400);
});

test('payment on a cancelled invoice is rejected', async () => {
  const invoice = await Invoice.create({ invoiceNumber: 'INV-TEST-CANCEL', clientId: client.id, caseId: caseA.id, status: 'cancelled', totalAmount: 10, paidAmount: 0, type: 'case_fees' });
  const { status } = await api('POST', `/api/payments/invoice/${invoice.id}`, {
    amount: 5, paymentDate: '2026-08-01', paymentMethod: 'cash'
  }, adminToken);
  assert.strictEqual(status, 400);
});

test('case-level payment with an invoice from another case is rejected (client isolation)', async () => {
  const invoiceB = await Invoice.create({ invoiceNumber: 'INV-B', clientId: client.id, caseId: caseB.id, status: 'sent', totalAmount: 10, paidAmount: 0, type: 'case_fees' });
  const { status } = await api('POST', '/api/payments', {
    caseId: caseA.id, invoiceId: invoiceB.id, amount: 5, paymentDate: '2026-08-01', paymentMethod: 'cash'
  }, adminToken);
  assert.strictEqual(status, 400);
  const payments = await Payment.findAll({ where: { invoiceId: invoiceB.id } });
  assert.strictEqual(payments.length, 0);
});

test('case financials summary excludes cancelled invoices and computes unbilled', async () => {
  await Invoice.create({ invoiceNumber: 'INV-CANCELLED-BIG', clientId: client.id, caseId: caseA.id, status: 'cancelled', totalAmount: 5000, paidAmount: 0, type: 'case_fees' });
  const { status, json } = await api('GET', `/api/cases/${caseA.id}/financials`, undefined, adminToken);
  assert.strictEqual(status, 200);
  const f = json.financials;
  assert.ok(f.totalInvoiced < 5000, 'cancelled invoice must not count toward totalInvoiced');
  assert.ok(f.outstanding >= 0);
  assert.ok(parseFloat(f.unbilledBillable) > 0, 'unbilled billable should be > 0');
  assert.strictEqual(f.invoiceCount, 8);
});

test('invoice grand total stores subtotal minus discount plus tax', async () => {
  const { status, json } = await api('POST', '/api/invoices', {
    clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 200,
    discount: 20, taxRate: 10,
    lines: [{ description: 'Taxable service', amount: 200 }]
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(parseFloat(json.invoice.taxAmount), 18);
  assert.strictEqual(parseFloat(json.invoice.totalAmount), 198);
});

test('overdue check flips past-due sent invoices to overdue and creates notifications', async () => {
  await Invoice.create({ invoiceNumber: 'INV-PAST-DUE', clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 30, paidAmount: 0, dueDate: '2020-01-01', type: 'case_fees' });
  const { status, json } = await api('GET', '/api/invoices/overdue', undefined, adminToken);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.overdue, 1);
  const overdue = await Invoice.findOne({ where: { invoiceNumber: 'INV-PAST-DUE' } });
  assert.strictEqual(overdue.status, 'overdue');
  const notifications = await Notification.findAll({ where: { userId: admin.id, type: 'payment_reminder' } });
  assert.ok(notifications.length > 0);
});

test('deleting a payment reverts invoice paidAmount and status', async () => {
  const invoice = await Invoice.create({ invoiceNumber: 'INV-REVERT', clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 50, paidAmount: 0, type: 'case_fees' });
  await api('POST', `/api/payments/invoice/${invoice.id}`, { amount: 50, paymentDate: '2026-08-01', paymentMethod: 'cash' }, adminToken);
  const payment = await Payment.findOne({ where: { invoiceId: invoice.id } });
  const { status } = await api('DELETE', `/api/payments/${payment.id}`, undefined, adminToken);
  assert.strictEqual(status, 200);
  const updated = await Invoice.findByPk(invoice.id);
  assert.strictEqual(parseFloat(updated.paidAmount), 0);
  assert.strictEqual(updated.status, 'sent');
});

test('invoice with payments cannot be deleted', async () => {
  const invoice = await Invoice.create({ invoiceNumber: 'INV-NO-DELETE', clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 20, paidAmount: 0, type: 'case_fees' });
  await api('POST', `/api/payments/invoice/${invoice.id}`, { amount: 20, paymentDate: '2026-08-01', paymentMethod: 'cash' }, adminToken);
  const { status } = await api('DELETE', `/api/invoices/${invoice.id}`, undefined, adminToken);
  assert.strictEqual(status, 400);
});

test('fee agreement upsert and read', async () => {
  const { status, json } = await api('PUT', `/api/cases/${caseA.id}/fee-agreement`, {
    feeArrangement: 'fixed_fee', agreedAmount: 1500
  }, adminToken);
  assert.strictEqual(status, 201);
  assert.strictEqual(parseFloat(json.agreement.agreedAmount), 1500);

  const read = await api('GET', `/api/cases/${caseA.id}/fee-agreement`, undefined, adminToken);
  assert.strictEqual(read.status, 200);
  assert.strictEqual(parseFloat(read.json.agreement.agreedAmount), 1500);
});

test('fee agreement reflects in case financials', async () => {
  const { json } = await api('GET', `/api/cases/${caseA.id}/financials`, undefined, adminToken);
  assert.strictEqual(parseFloat(json.financials.agreedFee), 1500);
});

test('client portal excludes draft invoices', async () => {
  await ClientPortalUser.create({ clientId: client.id, email: 'client@test.kw', password: 'Client@123', isActive: true });
  await Invoice.create({ invoiceNumber: 'INV-DRAFT-PORTAL', clientId: client.id, caseId: caseA.id, status: 'draft', totalAmount: 99, paidAmount: 0, type: 'case_fees' });
  await Invoice.create({ invoiceNumber: 'INV-SENT-PORTAL', clientId: client.id, caseId: caseA.id, status: 'sent', totalAmount: 77, paidAmount: 0, type: 'case_fees' });

  const login = await api('POST', '/api/portal/login', { email: 'client@test.kw', password: 'Client@123' });
  assert.strictEqual(login.status, 200);
  const portalToken = login.json.token;

  const { status, json } = await api('GET', '/api/portal/invoices', undefined, null, { Authorization: `Portal ${portalToken}` });
  assert.strictEqual(status, 200);
  const numbers = json.invoices.map((i) => i.invoiceNumber);
  assert.ok(numbers.includes('INV-SENT-PORTAL'));
  assert.ok(!numbers.includes('INV-DRAFT-PORTAL'), 'draft invoices must not be visible in the portal');
});
