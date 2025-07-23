import copyPublicAssets from './publicFolderMigration.js';
import handleStyles from './HandleStyles.js';
import srcHandle from './srcHandle.js';
import pagesFolderNormalizer from './pagesFolderNormalizer.js';
import handleClassNames from './HandleClassNames.js';
import jsxLogicHandler from './jsxLogicHandler.js';
import correctImportPaths from './CorrectImportPaths.js';

const [, , inputDir = 'sample-react-app'] = process.argv;

async function runPipeline(srcDir = inputDir) {
  // 1. Copy public assets
  console.log('\n=== Step 1: Copying public assets ===');
  await copyPublicAssets(srcDir + '/public', 'migration-output/public');
  console.log('✅ Public assets copied.');

  // 2. Handle styles
  console.log('\n=== Step 2: Migrating styles to CSS Modules ===');
  await handleStyles(srcDir + '/src/styles', 'migration-output/styles');
  console.log('✅ Styles migrated.');

  // 3. Handle src
  console.log('\n=== Step 3: Migrating src/pages and src/components ===');
  await srcHandle(srcDir + '/src', 'migration-output');
  console.log('✅ src/pages and src/components migrated.');

  // 4. Normalize pages
  console.log('\n=== Step 4: Normalizing pages folder for Next.js ===');
  await pagesFolderNormalizer('migration-output/pages');
  console.log('✅ Pages folder normalized.');

  // 5. Fix classnames
  console.log('\n=== Step 5: Fixing classnames and CSS imports ===');
  await handleClassNames('migration-output');
  console.log('✅ Classnames and CSS imports fixed.');

  // 6. Run JSX codemods
  console.log('\n=== Step 6: Running JSX codemods for Next.js compatibility ===');
  await jsxLogicHandler('migration-output');
  console.log('✅ JSX codemods complete.');

  // 7. Fix import paths
  console.log('\n=== Step 7: Correcting import paths ===');
  await correctImportPaths('migration-output');
  console.log('✅ Import paths fixed.');

  console.log('\n🎉 Migration pipeline complete! Check migration-output/pages for your Next.js app.');
}

runPipeline();