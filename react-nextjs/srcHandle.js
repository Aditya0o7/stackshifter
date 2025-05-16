
import fs from 'fs-extra';
import path from 'path';
import { globby } from 'globby';

async function migrate(srcDir, outDir) {
  const pagesDir = path.join(outDir, 'pages');
  const compsDir = path.join(outDir, 'components');

  // Clean & recreate directories
  await fs.remove(pagesDir);
  await fs.remove(compsDir);
  await fs.ensureDir(pagesDir);
  await fs.ensureDir(compsDir);

  // 1) Detect root component from main.jsx / index.jsx entry (ignore the file itself)
  const entryFiles = await globby(['main.jsx', 'main.tsx', 'index.jsx', 'index.tsx'], { cwd: srcDir });
  let rootComponentRel;
  if (entryFiles.length) {
    const entryPath = path.join(srcDir, entryFiles[0]);
    const content = await fs.readFile(entryPath, 'utf8');
    const match = content.match(/render\s*\(\s*<([A-Z][A-Za-z0-9_]*)\b/);
    const compName = match ? match[1] : null;
    if (compName) {
      const importRegex = new RegExp(`import\\s+${compName}\\s+from\\s+['\\"](.+)['\\"];`);
      const importMatch = content.match(importRegex);
      if (importMatch) {
        const importPath = importMatch[1];
        const ext = path.extname(importPath) || '.jsx';
        rootComponentRel = importPath.endsWith(ext)
          ? importPath
          : `${importPath}${ext}`;
      }
    }
  }

  // Fallback to App.jsx/tsx if detection fails
  if (!rootComponentRel) {
    const fallback = (await globby(['App.jsx','App.tsx'], { cwd: srcDir }))[0];
    rootComponentRel = fallback;
  }

  // Copy root component to pages/index.ext
  if (rootComponentRel) {
    const ext = path.extname(rootComponentRel);
    await fs.copy(
      path.join(srcDir, rootComponentRel),
      path.join(pagesDir, `index${ext}`)
    );
    console.log(`→ Root component ${rootComponentRel} → pages/index${ext}`);
  }

  // 2) Copy src/components/**/*.{js,jsx,ts,tsx} → components
  const compFiles = await globby(['components/**/*.{js,jsx,ts,tsx}'], { cwd: srcDir });
  for (const rel of compFiles) {
    const srcPath = path.join(srcDir, rel);
    const destPath = path.join(compsDir, path.relative('components', rel));
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath);
  }
  console.log(`→ Copied ${compFiles.length} component files to components/`);

  console.log('✅ Migration-output prepared: pages/ and components/ only');
}

// CLI entry

const srcDir = "sample-react-app/src";
const outDir = "migration-output";
if (!srcDir || !outDir) {
  console.error('Usage: node src_to_migration_v3.js <react-src> <migration-output>');
  process.exit(1);
}
migrate(srcDir, outDir).catch(err => {
  console.error(err);
  process.exit(1);
});
