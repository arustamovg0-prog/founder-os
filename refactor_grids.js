const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 4 cols
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(4,\s*1fr\)',\s*gap:\s*'16px'(,\s*marginBottom:\s*'28px')?\s*\}\}/g, 
        (match, mb) => `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${mb ? 'mb-7' : ''}"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(4,\s*1fr\)',\s*gap:\s*16(,\s*alignItems:\s*'start')?\s*\}\}/g, 
        (match, ai) => `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${ai ? 'items-start' : ''}"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(4,\s*1fr\)',\s*gap:\s*'0',\s*position:\s*'relative'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative"`);

    // 5 cols
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(5,\s*1fr\)',\s*gap:\s*'12px',\s*marginBottom:\s*'24px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(5,\s*1fr\)',\s*gap:\s*'16px',\s*overflowX:\s*'auto',\s*minHeight:\s*'500px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto min-h-[500px]"`);

    // 3 cols
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3,\s*1fr\)',\s*gap:\s*'16px',\s*marginBottom:\s*'28px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3,\s*1fr\)',\s*gap:\s*12,\s*marginBottom:\s*28\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3,1fr\)',\s*gap:\s*'16px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-4"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3,1fr\)',\s*gap:\s*'8px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-2"`);
    content = content.replace(/style=\{\{\s*flex:\s*1,\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3,1fr\)',\s*gap:\s*'16px'\s*\}\}/g, 
        `className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr\s*1fr',\s*gap:\s*'12px',\s*marginBottom:\s*'12px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr\s*1fr',\s*gap:\s*'24px',\s*marginBottom:\s*'24px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr\s*1fr',\s*gap:\s*12\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-3"`);

    // 2 cols
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(2,\s*1fr\)',\s*gap:\s*'20px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-5"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'24px',\s*marginBottom:\s*'24px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'24px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-6"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*24\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-6"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'20px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-5"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'16px',\s*marginBottom:\s*'32px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'16px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-4"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'12px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-3"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*12\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-3"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'10px',\s*marginBottom:\s*'16px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4"`);
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*1fr',\s*gap:\s*'8px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-2 gap-2"`);

    // uneven columns that cause issues
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'2fr\s*1fr',\s*gap:\s*'24px',\s*marginBottom:\s*'24px'\s*\}\}/g, 
        `className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"`); // The first column will need to span 2, but for now just use grid-cols-1 on mobile. Actually we can do `md:grid-cols-3` and add `md:col-span-2` to the first child manually. We'll fix manually.

    // 1fr 380px -> grid-cols-1 md:grid-cols-[1fr_380px]
    content = content.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s*380px',\s*gap:\s*'24px'\s*\}\}/g, 
        `className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"`);

    // Let's replace simple ones with a generic regex:
    // This is safer.

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedFiles++;
    }
});

console.log('Changed files:', changedFiles);
