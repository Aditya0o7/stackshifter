import copyPublicAssets from './publicFolderMigration.js';
import handleStyles from './HandleStyles.js';
import srcHandle from './srcHandle.js';
import pagesFolderNormalizer from './pagesFolderNormalizer.js';
import handleClassNames from './HandleClassNames.js';
import jsxLogicHandler from './jsxLogicHandler.js';
import correctImportPaths from './CorrectImportPaths.js';

async function runPipeline() {
  // 1. Copy public assets
  console.log('\n=== Step 1: Copying public assets ===');
  await copyPublicAssets();
  console.log('✅ Public assets copied.');

  // 2. Handle styles
  console.log('\n=== Step 2: Migrating styles to CSS Modules ===');
  await handleStyles();
  console.log('✅ Styles migrated.');

  // 3. Handle src
  console.log('\n=== Step 3: Migrating src/pages and src/components ===');
  await srcHandle();
  console.log('✅ src/pages and src/components migrated.');

  // 4. Normalize pages
  console.log('\n=== Step 4: Normalizing pages folder for Next.js ===');
  await pagesFolderNormalizer();
  console.log('✅ Pages folder normalized.');

  // 5. Fix classnames
  console.log('\n=== Step 5: Fixing classnames and CSS imports ===');
  await handleClassNames();
  console.log('✅ Classnames and CSS imports fixed.');

  // 6. Run JSX codemods
  console.log('\n=== Step 6: Running JSX codemods for Next.js compatibility ===');
  await jsxLogicHandler();
  console.log('✅ JSX codemods complete.');

  // 7. Fix import paths
  console.log('\n=== Step 7: Correcting import paths ===');
  await correctImportPaths();
  console.log('✅ Import paths fixed.');

  console.log('\n🎉 Migration pipeline complete! Check migration-output/pages for your Next.js app.');
}

runPipeline();