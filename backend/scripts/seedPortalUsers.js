require('dotenv').config();
const sequelize = require('../src/config/database');
const { Client, ClientPortalUser } = require('../src/models');

async function seedPortalUsers() {
  console.log('🔧 Seeding client portal users...');

  await sequelize.sync();
  const clients = await Client.findAll({ limit: 5 });

  const portalAccounts = [
    { clientIndex: 0, email: 'ahmed@client.kw', password: 'Client@123' },
    { clientIndex: 1, email: 'fatima@client.kw', password: 'Client@123' },
    { clientIndex: 2, email: 'khalid@client.kw', password: 'Client@123' },
    { clientIndex: 3, email: 'sara@client.kw', password: 'Client@123' },
    { clientIndex: 4, email: 'mohammed@client.kw', password: 'Client@123' },
  ];

  for (const acct of portalAccounts) {
    const client = clients[acct.clientIndex];
    if (!client) continue;

    const existing = await ClientPortalUser.findOne({ where: { email: acct.email } });
    if (existing) {
      console.log(`⚠️  ${acct.email} already exists — skipping`);
      continue;
    }

    await ClientPortalUser.create({
      clientId: client.id,
      email: acct.email,
      password: acct.password,
      isActive: true
    });
    console.log(`✅ Created portal user: ${acct.email} → Client: ${client.name}`);
  }

  console.log('\n📋 All portal accounts:');
  for (const acct of portalAccounts) {
    const client = clients[acct.clientIndex];
    if (client) {
      console.log(`   ${acct.email} / ${acct.password} → ${client.name}`);
    }
  }
}

seedPortalUsers().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
