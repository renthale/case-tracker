require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('📧 Testing SMTP connection...');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);

  const port = parseInt(process.env.SMTP_PORT || '587');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('\n📧 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"نظام إدارة القضايا" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '✅ اختبار نظام إدارة القضايا - Case Tracker SMTP Test',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #1a365d;">اختبار البريد الإلكتروني</h2>
          <p>مرحباً،</p>
          <p>هذا بريد اختباري من نظام إدارة القضايا.</p>
          <p>تم إعداد البريد الإلكتروني بنجاح!</p>
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>خادم SMTP:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>المنفذ:</strong> ${process.env.SMTP_PORT}</p>
            <p><strong>المُرسل:</strong> ${process.env.SMTP_USER}</p>
          </div>
          <p style="color: #2ecc71; font-weight: bold;">✅ الإعداد ناجح</p>
        </div>
      `
    });

    console.log('✅ Test email sent!');
    console.log('   Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }
}

testSMTP();
