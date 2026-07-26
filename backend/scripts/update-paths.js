const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../frontend/src/pages');

const files = fs.readdirSync(dir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'Portal' && d.name !== 'Landing' && d.name !== 'Auth')
  .flatMap(d => fs.readdirSync(path.join(dir, d.name)).filter(f => f.endsWith('.js')).map(f => path.join(dir, d.name, f)));

// Also include Auth/Login.js
files.push(path.join(dir, 'Auth', 'Login.js'));

let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace navigate('/path') patterns
  content = content.replace(/navigate\('\/cases/g, "navigate('/dashboard/cases");
  content = content.replace(/navigate\('\/clients/g, "navigate('/dashboard/clients");
  content = content.replace(/navigate\('\/sessions/g, "navigate('/dashboard/sessions");
  content = content.replace(/navigate\('\/documents/g, "navigate('/dashboard/documents");
  content = content.replace(/navigate\('\/invoices/g, "navigate('/dashboard/invoices");
  content = content.replace(/navigate\('\/transactions/g, "navigate('/dashboard/transactions");
  content = content.replace(/navigate\('\/reports'\)/g, "navigate('/dashboard/reports')");
  content = content.replace(/navigate\('\/'\)/g, "navigate('/dashboard')");

  // Replace to="/path" patterns (JSX Link)
  content = content.replace(/to="\/cases/g, 'to="/dashboard/cases');
  content = content.replace(/to="\/clients/g, 'to="/dashboard/clients');
  content = content.replace(/to="\/sessions/g, 'to="/dashboard/sessions');
  content = content.replace(/to="\/documents/g, 'to="/dashboard/documents');
  content = content.replace(/to="\/invoices/g, 'to="/dashboard/invoices');
  content = content.replace(/to="\/transactions/g, 'to="/dashboard/transactions');
  content = content.replace(/to="\/reports"/g, 'to="/dashboard/reports"');

  // Replace to={'/path'} patterns (JSX with curly braces)
  content = content.replace(/to=\{'\/cases/g, "to={'/dashboard/cases");
  content = content.replace(/to=\{'\/sessions/g, "to={'/dashboard/sessions");
  content = content.replace(/to=\{'\/documents/g, "to={'/dashboard/documents");
  content = content.replace(/to=\{'\/invoices/g, "to={'/dashboard/invoices");
  content = content.replace(/to=\{'\/transactions/g, "to={'/dashboard/transactions");

  // Replace to={`/path`} template literal patterns
  content = content.replace(/to=\{`\/cases/g, "to={`/dashboard/cases");
  content = content.replace(/to=\{`\/sessions/g, "to={`/dashboard/sessions");
  content = content.replace(/to=\{`\/documents/g, "to={`/dashboard/documents");
  content = content.replace(/to=\{`\/invoices/g, "to={`/dashboard/invoices");
  content = content.replace(/to=\{`\/transactions/g, "to={`/dashboard/transactions");

  if (content !== original) {
    const changes = (content.match(/\/dashboard\//g) || []).length - (original.match(/\/dashboard\//g) || []).length;
    totalChanges += changes;
    fs.writeFileSync(file, content);
    console.log(`✅ ${path.relative(path.join(__dirname, '../../frontend/src'), file)}: ${changes} paths updated`);
  }
}

console.log(`\n🎯 Total: ${totalChanges} path changes across ${files.filter(f => { let c = fs.readFileSync(f,'utf8'); return c.includes('/dashboard/'); }).length} files`);
