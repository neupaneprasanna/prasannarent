import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.md')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('Nexis') || content.includes('nexis')) {
        let newContent = content.replace(/Nexis/g, 'Nexis').replace(/nexis/g, 'nexis');
        // Handle WhyNexis.tsx imports specifically
        newContent = newContent.replace(/WhyNexis/g, 'WhyNexis');
        
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
    }
});

// Rename WhyNexis.tsx to WhyNexis.tsx if it exists
const oldFile = path.join(srcDir, 'components', 'sections', 'WhyNexis.tsx');
const newFile = path.join(srcDir, 'components', 'sections', 'WhyNexis.tsx');
if (fs.existsSync(oldFile)) {
    fs.renameSync(oldFile, newFile);
    console.log('Renamed WhyNexis.tsx to WhyNexis.tsx');
}

console.log(`Replaced 'Nexis' with 'Nexis' in ${changedFiles} files.`);
