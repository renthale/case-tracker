const { Session, Case } = require('../models');
const { Op } = require('sequelize');

const generateICS = (sessions) => {
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Case Tracker//Court Sessions//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';

  sessions.forEach(session => {
    const startDate = new Date(session.date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const caseTitle = session.Case?.title || 'Court Session';
    const caseNumber = session.Case?.caseNumber || '';
    const court = session.Case?.court || '';
    const location = session.location || court;

    ics += 'BEGIN:VEVENT\r\n';
    ics += `DTSTART:${formatICSDate(startDate)}\r\n`;
    ics += `DTEND:${formatICSDate(endDate)}\r\n`;
    ics += `SUMMARY:${caseTitle} - Session ${session.sessionNumber}\r\n`;
    ics += `DESCRIPTION:Case: ${caseNumber}\\nCourt: ${court}\\nSession: ${session.sessionNumber}\\nStatus: ${session.status}\r\n`;
    if (location) {
      ics += `LOCATION:${location}\r\n`;
    }
    ics += `UID:session-${session.id}@case-tracker\r\n`;
    ics += `STATUS:${session.status === 'scheduled' ? 'CONFIRMED' : 'TENTATIVE'}\r\n`;
    ics += 'END:VEVENT\r\n';
  });

  ics += 'END:VCALENDAR\r\n';
  return ics;
};

exports.downloadCalendar = async (req, res) => {
  try {
    const { startDate, endDate, caseId } = req.query;

    const where = {
      status: { [Op.in]: ['scheduled', 'postponed'] }
    };

    if (caseId) where.caseId = caseId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }

    const sessions = await Session.findAll({
      where,
      include: [{ model: Case, attributes: ['id', 'title', 'caseNumber', 'court'] }],
      order: [['date', 'ASC']]
    });

    const ics = generateICS(sessions);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=court-sessions.ics');
    res.send(ics);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في إنشاء ملف التقويم', details: error.message });
  }
};
