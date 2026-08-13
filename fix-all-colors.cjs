const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We want to match anything in className="" or className={``}
  // Because Tailwind classes can be scattered, we'll parse the class strings.
  const classRegex = /className=(["'])(.*?)\1|className=\{`([^`]+)`\}/g;

  content = content.replace(classRegex, (match, quote, p1, p2) => {
    const isTemplateString = !quote;
    let classString = isTemplateString ? p2 : p1;
    
    if (!classString) return match;

    // First, upgrade existing dark:text-slate-400 to dark:text-slate-300 for better dark mode contrast
    // and dark:text-slate-500 to dark:text-slate-300
    classString = classString.replace(/dark:text-(?:slate|gray)-(?:400|500)\b/g, 'dark:text-slate-300');

    // Check if it already has a dark:text- class
    const hasDarkText = /dark:text-[a-zA-Z0-9-]+/.test(classString);
    const hasLightText = /(?:^|\s)text-(?:slate|gray)-(?:300|400|500|600|700|800|900)\b/.test(classString);

    if (hasLightText && !hasDarkText) {
      // It has a light mode text color but no dark mode text color.
      // Let's add the appropriate dark mode color.
      if (/(?:^|\s)text-(?:slate|gray)-(?:300|400)\b/.test(classString)) {
        // Upgrade light mode to 500 so it's not "too light" on white backgrounds
        classString = classString.replace(/(?:^|\s)text-(?:slate|gray)-(?:300|400)\b/g, ' text-slate-500 dark:text-slate-300');
      } else if (/(?:^|\s)text-(?:slate|gray)-500\b/.test(classString)) {
        classString += ' dark:text-slate-300';
      } else if (/(?:^|\s)text-(?:slate|gray)-600\b/.test(classString)) {
        classString += ' dark:text-slate-300';
      } else if (/(?:^|\s)text-(?:slate|gray)-700\b/.test(classString)) {
        classString += ' dark:text-slate-200';
      } else if (/(?:^|\s)text-(?:slate|gray)-(?:800|900)\b/.test(classString)) {
        classString += ' dark:text-white';
      }
    }

    // Clean up multiple spaces
    classString = classString.replace(/\s+/g, ' ').trim();

    if (isTemplateString) {
      return `className={\`${classString}\`}`;
    } else {
      return `className=${quote}${classString}${quote}`;
    }
  });

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
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walk(srcDir);
