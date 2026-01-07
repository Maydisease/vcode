
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const newVersion = args[0];

if (!newVersion) {
    console.error('Usage: npm run release <version>');
    console.error('Example: npm run release 0.1.5');
    process.exit(1);
}

// Validation regex for version (simple semver)
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('Error: Version must be in format x.y.z (e.g., 0.1.5)');
    process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');

// 1. Update package.json
console.log(`Updating package.json to version ${newVersion}...`);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// 2. Update tauri.conf.json
console.log(`Updating tauri.conf.json to version ${newVersion}...`);
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

// 3. Git commit and tag
try {
    console.log('Committing changes...');
    // Add all changes to git
    execSync('git add .', { stdio: 'inherit', cwd: rootDir });
    execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'inherit', cwd: rootDir });

    console.log(`Creating tag v${newVersion}...`);
    execSync(`git tag v${newVersion}`, { stdio: 'inherit', cwd: rootDir });

    console.log('Pushing changes and tag...');
    execSync('git push origin HEAD', { stdio: 'inherit', cwd: rootDir });
    execSync(`git push origin v${newVersion}`, { stdio: 'inherit', cwd: rootDir });

    console.log('Release completed successfully!');
} catch (error) {
    console.error('Git operation failed:', error.message);
    process.exit(1);
}
