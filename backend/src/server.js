require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const runMigrations = require('./migrations/add-missing-columns');

const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const legalDocumentRoutes = require('./routes/legalDocumentRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const auditRoutes = require('./routes/auditRoutes');
const deadlineRoutes = require('./routes/deadlineRoutes');
const conflictRoutes = require('./routes/conflictRoutes');
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const clientPortalRoutes = require('./routes/clientPortalRoutes');
const exportRoutes = require('./routes/exportRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const { startScheduler } = require('./scheduler/sessionReminder');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files - JS/CSS with hashed filenames (safe to cache)
app.use(express.static(path.join(__dirname, '../../frontend/build'), {
  index: false
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/documents', legalDocumentRoutes);
app.use('/api/legal-documents', legalDocumentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/portal', clientPortalRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Serve React app for all non-API routes with strong no-cache
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  const indexPath = path.join(__dirname, '../../frontend/build', 'index.html');
  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    const buildTime = Date.now();
    html = html.replace(/(src="\/static\/js\/[^"]+?)"/g, `$1?v=${buildTime}"`);
    html = html.replace(/(href="\/static\/css\/[^"]+?)"/g, `$1?v=${buildTime}"`);
    res.send(html);
  } catch (err) {
    res.sendFile(indexPath);
  }
});

// Error handling
app.use(errorHandler);

// Database sync and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced (alter)');
    } catch (alterError) {
      console.warn('⚠️ Alter sync failed, trying basic sync:', alterError.message);
      await sequelize.sync();
      console.log('✅ Database synced (basic)');
    }

    await runMigrations();
    console.log('✅ Migrations completed');

    // Auto-seed client portal users if none exist
    const { ClientPortalUser, Client } = require('./models');
    const portalCount = await ClientPortalUser.count();
    if (portalCount === 0) {
      console.log('🔧 Seeding client portal users...');
      const clients = await Client.findAll({ limit: 5 });
      const accounts = [
        { idx: 0, email: 'ahmed@client.kw', password: 'Client@123' },
        { idx: 1, email: 'fatima@client.kw', password: 'Client@123' },
        { idx: 2, email: 'khalid@client.kw', password: 'Client@123' },
        { idx: 3, email: 'sara@client.kw', password: 'Client@123' },
        { idx: 4, email: 'mohammed@client.kw', password: 'Client@123' },
      ];
      for (const acct of accounts) {
        const client = clients[acct.idx];
        if (!client) continue;
        await ClientPortalUser.create({ clientId: client.id, email: acct.email, password: acct.password, isActive: true });
        console.log(`  ✅ ${acct.email} → ${client.name}`);
      }
      console.log('✅ Client portal users seeded');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      startScheduler();
    });
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    process.exit(1);
  }
};

startServer();
