const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace invalid x50 classes with valid closest match
  content = content.replace(/text-slate-250/g, 'text-slate-300');
  content = content.replace(/text-slate-350/g, 'text-slate-300');
  content = content.replace(/text-slate-450/g, 'text-slate-500');
  content = content.replace(/text-slate-550/g, 'text-slate-500');
  content = content.replace(/text-slate-650/g, 'text-slate-600');
  content = content.replace(/text-slate-750/g, 'text-slate-700');
  content = content.replace(/text-slate-850/g, 'text-slate-800');
  content = content.replace(/bg-slate-850/g, 'bg-slate-800');
  content = content.replace(/border-slate-250/g, 'border-slate-300');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walk(srcDir);
