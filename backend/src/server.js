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
app.use('/api/portal', clientPortalRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// JSON 404 for unknown API endpoints (prevent SPA fallback from masking API mistakes)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
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

    // Auto-seed client portal users — reset and recreate with correct client mappings
    try {
      const { ClientPortalUser, Client } = require('./models');
      const portalCount = await ClientPortalUser.count();

      // Delete old portal users and recreate
      if (portalCount > 0) {
        console.log('🔄 Resetting portal users...');
        await ClientPortalUser.destroy({ where: {} });
      }

      // Dynamically find clients by name and map portal accounts
      console.log('🔧 Seeding client portal users...');
      const clientMappings = [
        { search: 'عبدالله يوسف', email: 'abdullah@client.kw' },
        { search: 'محمد عبدالرحمن', email: 'mohammed@client.kw' },
        { search: 'سمير جعفر', email: 'samir@client.kw' },
        { search: 'يوسف فيصل', email: 'yousef@client.kw' },
        { search: 'فاطمة ناصر', email: 'fatima@client.kw' },
        { search: 'أحمد خالد الفهد', email: 'ahmed@client.kw' },
        { search: 'نورة سعيد', email: 'noura@client.kw' },
        { search: 'ريم فهد', email: 'reem@client.kw' },
        { search: 'منال حسن', email: 'manal@client.kw' },
        { search: 'حنان عبدالله', email: 'hanan@client.kw' },
      ];

      for (const mapping of clientMappings) {
        const client = await Client.findOne({ where: { name: { [require('sequelize').Op.like]: `%${mapping.search}%` } } });
        if (!client) { console.log(`  ⚠️ Client not found: ${mapping.search}`); continue; }
        await ClientPortalUser.create({ clientId: client.id, email: mapping.email, password: 'Client@123', isActive: true });
        console.log(`  ✅ ${mapping.email} → ${client.name} (ID: ${client.id})`);
      }
      console.log('✅ Client portal users seeded');
    } catch (seedError) {
      console.warn('⚠️ Portal seed skipped:', seedError.message);
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
