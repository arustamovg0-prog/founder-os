const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

const replacements = [
  // Tailwind text colors
  { regex: /text-\[\#f8fafc\]/g, replacement: 'text-[var(--text-primary)]' },
  { regex: /text-neutral-300/g, replacement: 'text-[var(--text-secondary)]' },
  { regex: /text-white/g, replacement: 'text-[var(--text-primary)]' },
  
  // Icon colors
  { regex: /color="white"/g, replacement: 'color="currentColor"' },
  { regex: /color="#f8fafc"/g, replacement: 'color="currentColor"' },
  { regex: /color="#[fF]{6}"/g, replacement: 'color="currentColor"' },
  { regex: /color: '#[fF]{6}'/g, replacement: "color: 'var(--text-primary)'" },
  { regex: /color: '#f8fafc'/g, replacement: "color: 'var(--text-primary)'" },

  // Tailwind backgrounds
  { regex: /bg-\[\#000000\]/g, replacement: 'bg-[var(--bg-card)]' },
  { regex: /bg-\[\#0a0a14\]/g, replacement: 'bg-[var(--bg-card)]' },
  { regex: /bg-\[\#050510\]/g, replacement: 'bg-[var(--bg-card)]' },
  { regex: /bg-\[\#09090b\]/g, replacement: 'bg-[var(--bg-card)]' },
  { regex: /bg-\[\#111\]/g, replacement: 'bg-[var(--bg-card)]' },
  { regex: /bg-black\/50/g, replacement: 'bg-black/10' },
  { regex: /bg-black(?![a-zA-Z0-9\-\/])/g, replacement: 'bg-[var(--bg-primary)]' },

  // Inline backgrounds
  { regex: /background: '#0[a-fA-F0-9]{5}'/g, replacement: "background: 'var(--bg-card)'" },
  { regex: /background: '#111'/g, replacement: "background: 'var(--bg-card)'" },
  { regex: /backgroundColor: '#0[a-fA-F0-9]{5}'/g, replacement: "backgroundColor: 'var(--bg-card)'" },
  { regex: /background: 'linear-gradient\(135deg, rgba\(0,0,0,0\.08\), rgba\(161,161,170,0\.05\)\)'/g, replacement: "background: 'var(--bg-card)'" },
  { regex: /background: 'rgba\(0,0,0,0\.05\)'/g, replacement: "background: 'var(--bg-card)'" },
  { regex: /background: 'rgba\(212,212,216,0\.04\)'/g, replacement: "background: 'var(--bg-card)'" },
  { regex: /background: 'rgba\(113,113,122,0\.04\)'/g, replacement: "background: 'var(--bg-card)'" },
  { regex: /background: 'rgba\(113,113,122,0\.1\)'/g, replacement: "background: 'rgba(0,0,0,0.05)'" },

  // Borders
  { regex: /border-white\/10/g, replacement: 'border-[var(--border)]' },
  { regex: /border-\[\#222\]/g, replacement: 'border-[var(--border)]' },
  
  // rgba(255,255,255,x) -> rgba(0,0,0,x) if missed by previous pass
  { regex: /rgba\(255,255,255,/g, replacement: 'rgba(0,0,0,' },
  { regex: /rgba\(255, 255, 255,/g, replacement: 'rgba(0, 0, 0,' },
];

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`\nRefactoring complete. ${changedFiles} files updated.`);
