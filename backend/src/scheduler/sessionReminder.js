const cron = require('node-cron');
const { Op } = require('sequelize');
const { Session, Case, User, Notification } = require('../models');
const { sendSessionReminder } = require('../utils/emailService');

const REMINDER_INTERVALS = [
  { hours: 24, label: 'غداً', priority: 'high' },
  { hours: 48, label: 'بعد يومين', priority: 'medium' },
  { hours: 168, label: 'بعد أسبوع', priority: 'low' }
];

const checkUpcomingSessions = async () => {
  try {
    const now = new Date();

    for (const interval of REMINDER_INTERVALS) {
      const startDate = new Date(now.getTime() + interval.hours * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const sessions = await Session.findAll({
        where: {
          date: {
            [Op.gte]: startDate,
            [Op.lt]: endDate
          },
          status: 'scheduled',
          remindersSent: false
        },
        include: [{
          model: Case,
          attributes: ['id', 'title', 'caseNumber', 'court', 'assignedLawyerId', 'courtAgentId']
        }]
      });

      for (const session of sessions) {
        if (!session.Case) continue;

        const userIds = new Set();
        if (session.Case.assignedLawyerId) userIds.add(session.Case.assignedLawyerId);
        if (session.Case.courtAgentId) userIds.add(session.Case.courtAgentId);

        const adminUsers = await User.findAll({
          where: { role: ['admin', 'partner'], isActive: true },
          attributes: ['id']
        });
        adminUsers.forEach(u => userIds.add(u.id));

        for (const userId of userIds) {
          const existingNotif = await Notification.findOne({
            where: {
              userId,
              sessionId: session.id,
              type: 'session_reminder'
            }
          });

          if (!existingNotif) {
            await Notification.create({
              userId,
              caseId: session.Case.id,
              sessionId: session.id,
              type: 'session_reminder',
              title: `تذكير بجلسة ${interval.label}`,
              message: `جلسة مجدولة ${interval.label} للقضية "${session.Case.title}" (${session.Case.caseNumber})`,
              priority: interval.priority,
              scheduledFor: startDate
            });

            // Send email notification
            const user = await User.findByPk(userId);
            if (user && user.email && interval.hours === 24) {
              await sendSessionReminder(user, session, session.Case, interval.label);
            }
          }
        }

        if (interval.hours === 24) {
          await session.update({ remindersSent: true });
        }
      }

      if (sessions.length > 0) {
        console.log(`📋 Created ${sessions.length} reminders for ${interval.label} sessions`);
      }
    }
  } catch (error) {
    console.error('Session reminder check error:', error);
  }
};

const checkAppealDeadlines = async () => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const cases = await Case.findAll({
      where: {
        status: { [Op.in]: ['won', 'lost', 'closed'] },
        verdictDate: { [Op.not]: null },
        appealDate: null
      }
    });

    for (const caseRecord of cases) {
      const verdictDate = new Date(caseRecord.verdictDate);
      const appealDeadline = new Date(verdictDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysUntilDeadline = Math.ceil((appealDeadline - now) / (1000 * 60 * 60 * 24));

      if (daysUntilDeadline > 0 && daysUntilDeadline <= 30) {
        const existingNotif = await Notification.findOne({
          where: {
            caseId: caseRecord.id,
            type: 'deadline',
            title: { [Op.like]: '%موعد الاستئناف%' }
          }
        });

        if (!existingNotif && caseRecord.assignedLawyerId) {
          await Notification.create({
            userId: caseRecord.assignedLawyerId,
            caseId: caseRecord.id,
            type: 'deadline',
            title: `موعد الاستئناف - ${daysUntilDeadline} يوم`,
            message: `موعد استئناف حكم القضية "${caseRecord.title}" خلال ${daysUntilDeadline} يوم`,
            priority: daysUntilDeadline <= 7 ? 'high' : 'medium'
          });
        }
      }
    }
  } catch (error) {
    console.error('Appeal deadline check error:', error);
  }
};

const startScheduler = () => {
  console.log('⏰ Starting session reminder scheduler...');

  // Check every hour
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Running hourly session check...');
    checkUpcomingSessions();
    checkAppealDeadlines();
  });

  // Initial check on startup
  setTimeout(() => {
    console.log('⏰ Running initial session check...');
    checkUpcomingSessions();
    checkAppealDeadlines();
  }, 5000);
};

module.exports = { startScheduler };
