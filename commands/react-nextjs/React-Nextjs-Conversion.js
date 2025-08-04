import path from 'path';
import copyPublicAssets from './publicFolderMigration.js';
import handleStyles from './HandleStyles.js';
import srcHandle from './srcHandle.js';
import pagesFolderNormalizer from './pagesFolderNormalizer.js';
import handleClassNames from './HandleClassNames.js';
import jsxLogicHandler from './jsxLogicHandler.js';
import correctImportPaths from './CorrectImportPaths.js';
import addUseClient from './addUseClient.js';
import fs from 'fs-extra';

// Simplified signature - removed nextjsAppPath parameter since integration is now handled in createNextJsApp.js
export default async function runPipeline(inputDir = process.cwd(), outputDir = null) {
  // ensure we have an absolute path to both input & output
  const srcDir = path.resolve(inputDir);
  const outDir = outputDir ? path.resolve(outputDir) : path.join(srcDir, 'migration-output');

  console.log(`\n🚀 Running pipeline:\n   srcDir = ${srcDir}\n   outDir = ${outDir}\n`);
  console.log('\n');

  // 1. Copy public assets
  console.log('=== Step 1: Copying public assets ===');
  await copyPublicAssets(
    path.join(srcDir, 'public'),
    path.join(outDir, 'public')
  );
  console.log('✅ Public assets copied.');
  console.log('\n');

  // 2. Handle styles
  console.log('=== Step 2: Migrating styles to CSS Modules ===');
  await handleStyles(
    path.join(srcDir, 'src', 'styles'),
    path.join(outDir, 'styles')
  );
  console.log('✅ Styles migrated.');
  console.log('\n');

  // 3. Handle src/pages & src/components
  console.log('=== Step 3: Migrating src/pages and src/components ===');
  const pagesSrc = path.join(srcDir, 'src');
  // force forward‑slashes:
  const normalizedPagesSrc = pagesSrc.replace(/\\/g, '/');
  const normalizedOutDir = outDir.replace(/\\/g, '/');
  await srcHandle(
    normalizedPagesSrc,
    normalizedOutDir,
  );
  console.log('✅ src/pages and src/components migrated.');
  console.log('\n');

  // 4. Normalize pages
  console.log('=== Step 4: Normalizing pages folder for Next.js ===');
  await pagesFolderNormalizer(
    path.join(outDir)
  );
  console.log('✅ Pages folder normalized.');
  console.log('\n');

  // 5. Fix classnames
  console.log('=== Step 5: Fixing classnames and CSS imports ===');
  await handleClassNames(outDir);
  console.log('✅ Classnames and CSS imports fixed.');
  console.log('\n');

  // 6. Run JSX codemods
  console.log('=== Step 6: Running JSX codemods for Next.js compatibility ===');
  await jsxLogicHandler(outDir);
  console.log('✅ JSX codemods complete.');
  console.log('\n');

  // 7. Fix import paths
  console.log('=== Step 7: Correcting import paths ===');
  await correctImportPaths(outDir);
  console.log('✅ Import paths fixed.');
  console.log('\n');

  // 8. Add "use client" directive where needed
  console.log('=== Step 8: Adding "use client" directives where needed ===');
  await addUseClient(outDir);
  console.log('✅ "use client" directives added.');
  console.log('\n');

  // Removed Step 9 - Next.js app integration is now handled in createNextJsApp.js

  console.log(`\n🎉 Migration pipeline complete! Check ${outDir}/ for your converted React app.`);
  
  // Return the output directory so createNextJsApp.js can use it
  return outDir;
}