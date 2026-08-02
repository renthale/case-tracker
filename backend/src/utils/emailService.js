require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter = null;

const createTransporter = (port) => {
  const host = process.env.SMTP_HOST || 'mail.webtoze.com';
  const user = process.env.SMTP_USER || 'support@webtoze.com';
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
};

const initTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_PASS) {
    console.log('📧 SMTP not configured (SMTP_PASS missing); emails will be skipped');
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || '465');
  transporter = createTransporter(port);
  return transporter;
};

const sendEmail = async (options) => {
  const transport = initTransporter();
  if (!transport) {
    console.log('📧 Email not sent (SMTP not configured):', options.subject);
    return { sent: false, reason: 'SMTP not configured' };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"نظام إدارة القضايا" <${process.env.SMTP_USER || 'support@webtoze.com'}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  try {
    const sendPromise = transport.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout')), 15000)
    );
    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log('📧 Email sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email send failed (port ' + (process.env.SMTP_PORT || '465') + '):', error.message);
    transporter = null;

    const fallbackPort = parseInt(process.env.SMTP_PORT || '465') === 465 ? 587 : 465;
    console.log('📧 Retrying on port', fallbackPort);
    try {
      const fallbackTransport = createTransporter(fallbackPort);
      const info = await Promise.race([
        fallbackTransport.sendMail(mailOptions),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP fallback timeout')), 15000))
      ]);
      console.log('📧 Email sent (fallback port ' + fallbackPort + '):', info.messageId);
      transporter = fallbackTransport;
      return { sent: true, messageId: info.messageId };
    } catch (fallbackError) {
      console.error('📧 Fallback also failed (port ' + fallbackPort + '):', fallbackError.message);
      return { sent: false, reason: fallbackError.message };
    }
  }
};

const sendSessionReminder = async (user, session, caseRecord, interval) => {
  return sendEmail({
    to: user.email,
    subject: `تذكير بجلسة ${interval} - ${caseRecord.caseNumber}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1a365d;">تذكير بجلسة محكمة</h2>
        <p>مرحباً ${user.fullName},</p>
        <p>هذا تذكير بجلسة محكمة ${interval}:</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>القضية:</strong> ${caseRecord.title}</p>
          <p><strong>رقم القضية:</strong> ${caseRecord.caseNumber}</p>
          <p><strong>المحكمة:</strong> ${caseRecord.court || 'غير محدد'}</p>
          <p><strong>رقم الجلسة:</strong> ${session.sessionNumber}</p>
          <p><strong>التاريخ:</strong> ${new Date(session.date).toLocaleDateString('ar-KW')}</p>
          ${session.time ? `<p><strong>الوقت:</strong> ${session.time}</p>` : ''}
          ${session.location ? `<p><strong>الموقع:</strong> ${session.location}</p>` : ''}
        </div>
        <p style="color: #e53e3e; font-weight: bold;">يرجى التأكد من الحضور في الموعد المحدد.</p>
      </div>
    `
  });
};

const sendInvoiceCreated = async (user, invoice, client) => {
  return sendEmail({
    to: user.email,
    subject: `فاتورة جديدة - ${invoice.invoiceNumber}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1a365d;">فاتورة جديدة</h2>
        <p>مرحباً ${user.fullName},</p>
        <p>تم إنشاء فاتورة جديدة:</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>العميل:</strong> ${client?.name || 'غير محدد'}</p>
          <p><strong>المبلغ الإجمالي:</strong> ${invoice.totalAmount} د.ك</p>
          ${invoice.dueDate ? `<p><strong>تاريخ الاستحقاق:</strong> ${invoice.dueDate}</p>` : ''}
        </div>
      </div>
    `
  });
};

const sendCaseUpdate = async (user, caseRecord, oldStatus, newStatus) => {
  return sendEmail({
    to: user.email,
    subject: `تحديث حالة القضية - ${caseRecord.caseNumber}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1a365d;">تحديث حالة القضية</h2>
        <p>مرحباً ${user.fullName},</p>
        <p>تم تحديث حالة القضية "${caseRecord.title}" (${caseRecord.caseNumber}):</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>من:</strong> ${oldStatus}</p>
          <p><strong>إلى:</strong> ${newStatus}</p>
        </div>
      </div>
    `
  });
};

const PORTAL_BASE = process.env.PORTAL_URL || 'https://case-tracker-production-25db.up.railway.app/#/portal';

const sendPortalInvitation = async (client, email, inviteToken, inviteUrl) => {
  return sendEmail({
    to: email,
    subject: 'دعوة لتفعيل حسابك في بوابة العميل - Client Portal Invitation',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1a365d;">مرحباً ${client.name}</h2>
        <p>تم إنشاء حساب لك في بوابة العميل. اضغط على الرابط التالي لتفعيل حسابك واختيار كلمة المرور:</p>
        <p style="margin: 20px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">تفعيل الحساب واختيار كلمة المرور</a>
        </p>
        <p style="background: #f7fafc; padding: 12px; border-radius: 8px;">
          <strong>بريد الدخول:</strong> ${email}
        </p>
        <p style="color: #718096; font-size: 0.85rem;">هذا الرابط صالح لمدة 48 ساعة ويمكن استخدامه مرة واحدة فقط.</p>
      </div>
    `
  });
};

const sendPortalPasswordReset = async (client, email, resetUrl) => {
  return sendEmail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور - بوابة العميل',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1a365d;">إعادة تعيين كلمة المرور</h2>
        <p>مرحباً ${client.name}،</p>
        <p>وصلنا طلب لإعادة تعيين كلمة مرور حسابك في بوابة العميل. اضغط على الرابط التالي خلال ساعة واحدة:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">إعادة تعيين كلمة المرور</a>
        </p>
        <p style="color: #718096; font-size: 0.85rem;">إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد.</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendSessionReminder,
  sendInvoiceCreated,
  sendCaseUpdate,
  sendPortalInvitation,
  sendPortalPasswordReset,
  PORTAL_BASE
};
