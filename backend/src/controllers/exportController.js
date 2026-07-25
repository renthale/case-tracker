const { Case, Client, Invoice, Session, User } = require('../models');
const { Op } = require('sequelize');

const convertToCSV = (data, columns) => {
  if (!data.length) return '';

  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let value = row[c.key];
      if (value === null || value === undefined) value = '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers, ...rows].join('\n');
};

exports.exportCases = async (req, res) => {
  try {
    const { format = 'csv', status, type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const cases = await Case.findAll({
      where,
      include: [
        { model: User, as: 'assignedLawyer', attributes: ['fullName'] },
        { model: Client, as: 'client', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const columns = [
      { key: 'caseNumber', label: 'Case Number' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'court', label: 'Court' },
      { key: 'judge', label: 'Judge' },
      { key: 'opposingParty', label: 'Opposing Party' },
      { key: 'filingDate', label: 'Filing Date' },
      { key: 'nextHearingDate', label: 'Next Hearing' },
      { key: 'caseFees', label: 'Case Fees (KWD)' },
      { key: 'assignedLawyer.fullName', label: 'Assigned Lawyer' },
      { key: 'client.name', label: 'Client' }
    ];

    const data = cases.map(c => ({
      ...c.toJSON(),
      'assignedLawyer.fullName': c.assignedLawyer?.fullName || '',
      'client.name': c.client?.name || ''
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=cases-export.json');
      return res.json(data);
    }

    const csv = convertToCSV(data, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=cases-export.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تصدير القضايا', details: error.message });
  }
};

exports.exportClients = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    const clients = await Client.findAll({ order: [['name', 'ASC']] });

    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'civilId', label: 'Civil ID' },
      { key: 'address', label: 'Address' },
      { key: 'nationality', label: 'Nationality' },
      { key: 'notes', label: 'Notes' }
    ];

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=clients-export.json');
      return res.json(clients);
    }

    const csv = convertToCSV(clients, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=clients-export.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تصدير العملاء', details: error.message });
  }
};

exports.exportInvoices = async (req, res) => {
  try {
    const { format = 'csv', status } = req.query;

    const where = {};
    if (status) where.status = status;

    const invoices = await Invoice.findAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['name'] },
        { model: Case, as: 'case', attributes: ['caseNumber', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const columns = [
      { key: 'invoiceNumber', label: 'Invoice Number' },
      { key: 'client.name', label: 'Client' },
      { key: 'case.caseNumber', label: 'Case Number' },
      { key: 'totalAmount', label: 'Total (KWD)' },
      { key: 'paidAmount', label: 'Paid (KWD)' },
      { key: 'status', label: 'Status' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'createdAt', label: 'Created' }
    ];

    const data = invoices.map(inv => ({
      ...inv.toJSON(),
      'client.name': inv.client?.name || '',
      'case.caseNumber': inv.case?.caseNumber || ''
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=invoices-export.json');
      return res.json(data);
    }

    const csv = convertToCSV(data, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices-export.csv');
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تصدير الفواتير', details: error.message });
  }
};
