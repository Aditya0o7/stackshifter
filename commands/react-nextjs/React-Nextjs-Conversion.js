import path from 'path';
import copyPublicAssets from './publicFolderMigration.js';
import handleStyles           from './HandleStyles.js';
import srcHandle              from './srcHandle.js';
import pagesFolderNormalizer  from './pagesFolderNormalizer.js';
import handleClassNames       from './HandleClassNames.js';
import jsxLogicHandler        from './jsxLogicHandler.js';
import correctImportPaths     from './CorrectImportPaths.js';

// const [, , inputDir = 'sample-react-app'] = process.argv;



export default async function runPipeline(inputDir = process.cwd()) {
  // ensure we have an absolute path to both input & output
  const srcDir = path.resolve(inputDir);
  const outDir = path.join(srcDir, 'migration-output');

  console.log(`\n🚀 Running pipeline:\n   srcDir = ${srcDir}\n   outDir = ${outDir}\n`);

  // 1. Copy public assets
  console.log('=== Step 1: Copying public assets ===');
  await copyPublicAssets(
    path.join(srcDir, 'public'),
    path.join(outDir, 'public')
  );
  console.log('✅ Public assets copied.');

  // 2. Handle styles
  console.log('=== Step 2: Migrating styles to CSS Modules ===');
  await handleStyles(
    path.join(srcDir, 'src', 'styles'),
    path.join(outDir, 'styles')
  );
  console.log('✅ Styles migrated.');

  // 3. Handle src/pages & src/components
  console.log('=== Step 3: Migrating src/pages and src/components ===');
  await srcHandle(
    path.join(srcDir, 'src'),
    outDir
  );
  console.log('✅ src/pages and src/components migrated.');

  // 4. Normalize pages
  console.log('=== Step 4: Normalizing pages folder for Next.js ===');
  await pagesFolderNormalizer(
    path.join(outDir, 'pages')
  );
  console.log('✅ Pages folder normalized.');

  // 5. Fix classnames
  console.log('=== Step 5: Fixing classnames and CSS imports ===');
  await handleClassNames(outDir);
  console.log('✅ Classnames and CSS imports fixed.');

  // 6. Run JSX codemods
  console.log('=== Step 6: Running JSX codemods for Next.js compatibility ===');
  await jsxLogicHandler(outDir);
  console.log('✅ JSX codemods complete.');

  // 7. Fix import paths
  console.log('=== Step 7: Correcting import paths ===');
  await correctImportPaths(outDir);
  console.log('✅ Import paths fixed.');

  console.log(`\n🎉 Migration pipeline complete! Check ${outDir}/pages for your Next.js app.`);
}

// runPipeline();