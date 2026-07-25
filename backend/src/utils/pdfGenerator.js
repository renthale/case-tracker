const PDFDocument = require('pdfkit');

const generateInvoicePDF = async (invoice, client, caseRecord) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text(' faktura', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text('Law Firm Case Management System', { align: 'center' });
    doc.moveDown(1);

    // Invoice details
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    if (invoice.dueDate) {
      doc.text(`Due Date: ${invoice.dueDate}`);
    }
    doc.moveDown();

    // Client info
    if (client) {
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(11);
      doc.text(client.name);
      if (client.phone) doc.text(`Phone: ${client.phone}`);
      if (client.email) doc.text(`Email: ${client.email}`);
      if (client.address) doc.text(`Address: ${client.address}`);
      doc.moveDown();
    }

    // Case info
    if (caseRecord) {
      doc.fontSize(12).text('Case Details:', { underline: true });
      doc.fontSize(11);
      doc.text(`Case Number: ${caseRecord.caseNumber}`);
      doc.text(`Case Title: ${caseRecord.title}`);
      doc.moveDown();
    }

    // Line items (simplified)
    doc.fontSize(12).text('Description', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11);
    if (invoice.description) {
      doc.text(invoice.description);
    }
    doc.moveDown();

    // Totals
    doc.fontSize(12).text('Amount Summary:', { underline: true });
    doc.fontSize(11);
    doc.text(`Subtotal: ${invoice.totalAmount || 0} KWD`);
    if (invoice.discount > 0) {
      doc.text(`Discount: -${invoice.discount} KWD`);
    }
    if (invoice.taxAmount > 0) {
      doc.text(`Tax: ${invoice.taxAmount} KWD`);
    }
    doc.moveDown(0.5);
    doc.fontSize(13).text(`Total Amount: ${invoice.totalAmount || 0} KWD`, { bold: true });
    doc.text(`Paid Amount: ${invoice.paidAmount || 0} KWD`);
    doc.text(`Balance Due: ${(invoice.totalAmount || 0) - (invoice.paidAmount || 0)} KWD`);
    doc.moveDown();

    // Payment status
    doc.fontSize(11).text(`Status: ${invoice.status?.toUpperCase() || 'PENDING'}`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(9).fillColor('#666')
      .text('This is a computer-generated invoice.', { align: 'center' })
      .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  });
};

const generateReportPDF = async (title, data, columns) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
      bufferPages: true
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666')
      .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const startX = 40;
    let y = doc.y;
    const colWidth = (doc.page.width - 80) / columns.length;

    doc.fontSize(10).fillColor('#333');
    columns.forEach((col, i) => {
      doc.text(col.label, startX + (i * colWidth), y, { width: colWidth, align: 'left' });
    });

    y += 20;
    doc.moveTo(startX, y).lineTo(doc.page.width - 40, y).stroke();
    y += 5;

    // Table rows
    doc.fontSize(9).fillColor('#333');
    data.forEach((row, rowIndex) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }

      columns.forEach((col, i) => {
        const value = row[col.key] || '-';
        doc.text(String(value).substring(0, 50), startX + (i * colWidth), y, { width: colWidth, align: 'left' });
      });

      y += 18;
      if (rowIndex % 2 === 0) {
        doc.rect(startX, y - 15, doc.page.width - 80, 18).fill('#f5f5f5').fill('#333');
      }
    });

    doc.end();
  });
};

module.exports = { generateInvoicePDF, generateReportPDF };
