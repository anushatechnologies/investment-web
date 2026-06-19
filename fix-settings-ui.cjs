const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'SettingsPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replacements to support light/dark mode and add premium hover effects
content = content.replace(/border-white\/10 bg-white\/\[0\.03\]/g, 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] shadow-sm dark:shadow-none transition-all duration-300 hover:shadow-md dark:hover:bg-white/[0.05] hover:border-indigo-200 dark:hover:border-indigo-500/30');

// Fix text-white on headings and values
content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');

// Fix text-slate-200 for subheadings
content = content.replace(/text-slate-200/g, 'text-slate-800 dark:text-slate-200');

// Fix the info boxes
content = content.replace(/border-blue-500\/20 bg-blue-500\/10 p-5 text-sm leading-7 text-blue-100/g, 'border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-5 text-sm leading-7 text-indigo-900 dark:text-indigo-200');

// Fix text-gold-soft icon colors (they are fine in dark, but might be too light in light mode).
// Let's change them to indigo-500 in light mode and gold-soft in dark mode.
// Actually, gold-soft is usually #fde047 or similar. Let's use `text-indigo-500 dark:text-gold-soft`.
// Wait, is gold-soft defined? Yes, in tailwind. Let's just do text-indigo-600 dark:text-gold-soft
content = content.replace(/text-gold-soft/g, 'text-indigo-600 dark:text-indigo-400');

// Add specific input shell styling if it's missing hover/focus rings.
// We'll leave input-shell alone, assuming index.css handles it, but we can verify.

fs.writeFileSync(filePath, content, 'utf8');
console.log('SettingsPage.jsx UI classes updated.');
