const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\HP\\Desktop\\investment_web\\investment-web\\src';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('text-slate-400 dark:text-slate-500')) {
        const newContent = content.replace(/text-slate-400 dark:text-slate-500/g, 'text-slate-500 dark:text-slate-400');
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Fixed ' + fullPath);
      }
    }
  }
}

walk(srcDir);
