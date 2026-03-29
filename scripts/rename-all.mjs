import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const targetDirs = ['src', 'server', 'verify', 'scripts', 'artifacts/mockup-sandbox'];
const targetFiles = ['NEXIS_SPECS.md', 'README.md'];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else if (/\.(ts|tsx|js|mjs|jsx|css|md|json)$/i.test(file)) {
            // skip package-lock.json
            if (!file.endsWith('package-lock.json')) {
              results.push(file);
            }
        }
    });
    return results;
}

let allTargetFiles = [];
targetDirs.forEach(dir => {
    allTargetFiles = allTargetFiles.concat(walk(path.join(rootDir, dir)));
});
targetFiles.forEach(file => {
    const p = path.join(rootDir, file);
    if (fs.existsSync(p)) allTargetFiles.push(p);
});

let changedFiles = 0;

allTargetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /Nexis|nexis|NEXIS/gi;
    
    if (regex.test(content)) {
        let newContent = content.replace(/Nexis/g, 'Nexis')
                                .replace(/nexis/g, 'nexis')
                                .replace(/NEXIS/g, 'NEXIS');
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
    }
});

console.log(`Deep replacement completed. Modified ${changedFiles} files.`);

// Rename NEXIS_SPECS.md if it exists
const oldSpec = path.join(rootDir, 'NEXIS_SPECS.md');
const newSpec = path.join(rootDir, 'NEXIS_SPECS.md');
if (fs.existsSync(oldSpec)) {
    fs.renameSync(oldSpec, newSpec);
    console.log('Renamed NEXIS_SPECS.md to NEXIS_SPECS.md');
}
