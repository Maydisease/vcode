
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

// Helper to run command with error handling
const runCommand = (command, errorMessage) => {
    try {
        console.log(`\nRunning: ${command}`);
        execSync(command, { stdio: 'inherit', cwd: rootDir });
    } catch (error) {
        console.error(`\n❌ Error: ${errorMessage}`);
        console.error(`Command failed: ${command}`);
        process.exit(1);
    }
};

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

// 3. Git operations
console.log('\nGit operations...');

// Add changes
runCommand('git add .', 'Failed to stage changes.');

// Commit
runCommand(`git commit -m "chore(release): v${newVersion}"`, 'Failed to commit changes. Make sure you have staged changes or there are changes to commit.');

// Push commit BEFORE tagging
runCommand('git push origin HEAD', 'Failed to push commit. Please check your network or remote permissions.');

// Tag
console.log(`\nCreating tag v${newVersion}...`);
runCommand(`git tag v${newVersion}`, `Failed to create tag v${newVersion}. Tag might already exist.`);

// Push tag
runCommand(`git push origin v${newVersion}`, 'Failed to push tag.');

console.log('\n✅ Release completed successfully!');
