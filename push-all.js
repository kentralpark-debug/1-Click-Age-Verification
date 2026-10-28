const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const apps = fs.readdirSync(rootDir).filter(file => {
  const fullPath = path.join(rootDir, file);
  return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, '.git'));
});

console.log(`Found ${apps.length} Git repositories.`);

for (const app of apps) {
  const appPath = path.join(rootDir, app);
  console.log(`\n========================================`);
  console.log(`Processing: ${app}`);
  console.log(`========================================`);

  try {
    // 変更があるか確認
    const status = execSync('git status --porcelain', { cwd: appPath, encoding: 'utf8' });
    if (!status.trim()) {
      console.log(`No changes in ${app}, skipping.`);
      continue;
    }

    // git add
    console.log(`Adding changes...`);
    execSync('git add .', { cwd: appPath, stdio: 'inherit' });

    // git commit
    console.log(`Committing...`);
    try {
      execSync('git commit -m "fix: switch billing isTest to dynamic based on NODE_ENV"', { cwd: appPath, stdio: 'inherit' });
    } catch (e) {
      console.log(`Commit skipped or failed for ${app}`);
    }

    // git push
    console.log(`Pushing to remote...`);
    execSync('git push', { cwd: appPath, stdio: 'inherit' });
    console.log(`Successfully pushed ${app}!`);

  } catch (error) {
    console.error(`Error processing ${app}:`, error.message);
  }
}

console.log('\nAll apps processed!');
