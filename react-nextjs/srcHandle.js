#!/usr/bin/env node
/**
 * Usage:
 *   node srcHandle.js <path-to-react-src> <path-to-next-app>
 */

import fs from 'fs-extra';
import path from 'path';
import { globby } from 'globby';

async function run(srcDir, nextAppDir) {
  const pagesDir     = path.join(nextAppDir, 'pages');
  const componentsDir = path.join(nextAppDir, 'components');

  // Clean & recreate
  await fs.remove(pagesDir);
  await fs.remove(componentsDir);
  await fs.ensureDir(pagesDir);
  await fs.ensureDir(componentsDir);

  // 1) Copy App.jsx/tsx → pages/_app.jsx(tsx)
  const appMatch = await globby(['App.jsx', 'App.tsx'], { cwd: srcDir });
  if (appMatch[0]) {
    const ext = path.extname(appMatch[0]);
    await fs.copy(
      path.join(srcDir, appMatch[0]),
      path.join(pagesDir, `_app${ext}`)
    );
  }

  // 2) Copy everything under src/components → components
  const compFiles = await globby(['components/**/*'], { cwd: srcDir, dot: true });
  for (const rel of compFiles) {
    const srcPath  = path.join(srcDir, rel);
    const destPath = path.join(componentsDir, path.relative('components', rel));
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath);
  }

  // 3) Copy all other .jsx/.tsx under src (excluding components/) → pages
  const pageFiles = await globby(['**/*.{jsx,tsx}'], {
    cwd: srcDir,
    ignore: ['components/**']
  });
  for (const rel of pageFiles) {
    const srcPath  = path.join(srcDir, rel);
    const destPath = path.join(pagesDir, rel);
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath);
  }

  console.log('✅ Extraction complete');
  console.log(`→ pages:     ${pagesDir}`);
  console.log(`→ components: ${componentsDir}`);
  console.log(`→ src:       ${srcDir}`);
  console.log(`→ next:      ${nextAppDir}`);
}

// --- ESM-compatible “main” logic ---
const [srcDir, nextAppDir] = process.argv.slice(2);
if (!srcDir || !nextAppDir) {
  console.error('Usage: node srcHandle.js <react-src> <next-app>');
  process.exit(1);
}

run(srcDir, nextAppDir).catch(err => {
  console.error('❌', err);
  process.exit(1);
});
