const fs = require('fs');

const filePath = 'c:\\Users\\HP\\Desktop\\investment_web\\investment-web\\src\\pages\\InvestmentStatus.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Dark Mode Colors:
// Change rgba(148, 163, 184, 0.7) to rgba(226, 232, 240, 0.9)
content = content.replace(/rgba\(148,\s*163,\s*184,\s*0\.7\)/g, 'rgba(226, 232, 240, 0.9)');

// Change rgba(148, 163, 184, 0.5) to rgba(226, 232, 240, 0.7)
content = content.replace(/rgba\(148,\s*163,\s*184,\s*0\.5\)/g, 'rgba(226, 232, 240, 0.7)');

// Light Mode Colors (Make them darker and more readable):
// Change rgba(100, 116, 139, 0.8) to rgba(71, 85, 105, 1)
content = content.replace(/rgba\(100,\s*116,\s*139,\s*0\.8\)/g, 'rgba(71, 85, 105, 1)');

// Change rgba(100, 116, 139, 0.6) to rgba(71, 85, 105, 0.9)
content = content.replace(/rgba\(100,\s*116,\s*139,\s*0\.6\)/g, 'rgba(71, 85, 105, 0.9)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed InvestmentStatus.jsx');
