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
  { regex: /fontFamily: 'Space Grotesk, sans-serif'/g, replacement: "fontFamily: 'var(--font-space-grotesk), sans-serif'" },
  { regex: /fontFamily: "Space Grotesk, sans-serif"/g, replacement: "fontFamily: 'var(--font-space-grotesk), sans-serif'" },
  { regex: /fontFamily: 'Space Grotesk'/g, replacement: "fontFamily: 'var(--font-space-grotesk), sans-serif'" }
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
    console.log(`Updated fonts in ${file}`);
  }
});

console.log(`\nRefactoring complete. ${changedFiles} files updated.`);
