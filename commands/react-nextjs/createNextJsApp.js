import { execCommand, validateDirectory } from './processUtils.js';
import runPipeline from './React-Nextjs-Conversion.js';
import { getAllJsFiles } from './jsxLogicHandler.js'; // NEW IMPORT
import fs from 'fs-extra';
import path from 'path';

export default async function createNextJsApp(sourceDir, targetDir, appName) {
  const nextjsAppPath = path.join(targetDir, appName);
  const tempMigrationOutput = path.join(sourceDir, 'temp-migration-output');
  
  try {
    console.log('🚀 Starting Enhanced React to Next.js Migration');
    console.log('===============================================');
    
    // 1. Validate inputs (SAME AS BEFORE)
    console.log('=== Step 1: Validating inputs ===');
    validateDirectory(sourceDir, true);
    validateDirectory(path.dirname(targetDir), true);
    
    if (await fs.pathExists(nextjsAppPath)) {
      throw new Error(`Next.js app directory already exists: ${nextjsAppPath}`);
    }
    
    console.log('✅ Input validation passed');
    console.log(`   Source: ${sourceDir}`);
    console.log(`   Target: ${nextjsAppPath}`);
    console.log('\n');
    
    // 2. Create Next.js app (SAME AS BEFORE)
    console.log('=== Step 2: Creating Next.js 13+ app ===');
    await fs.ensureDir(targetDir);
    await execCommand(`npx create-next-app@latest ${appName} --javascript --tailwind --eslint --app --src-dir --import-alias "@/*"`, { 
      cwd: targetDir 
    });
    console.log('✅ Next.js app created successfully');
    console.log('\n');
    
    // 3. Run EXACT SAME pipeline as shiftto (SIMPLIFIED)
    console.log('=== Step 3: Running migration pipeline (same as shiftto) ===');
    const migrationOutputDir = await runPipeline(sourceDir, tempMigrationOutput);
    console.log('✅ Migration pipeline completed - migration-output folder created');
    console.log('\n');
    
    // 4. Copy from migration-output to Next.js app structure (NEW LOGIC)
    console.log('=== Step 4: Copying migration-output to Next.js app ===');
    
    // 4a. Components: migration-output/components → src/components
    const componentsDir = path.join(migrationOutputDir, 'components');
    if (await fs.pathExists(componentsDir)) {
      const targetComponentsDir = path.join(nextjsAppPath, 'src', 'components');
      await fs.copy(componentsDir, targetComponentsDir);
      console.log(`✅ Components: migration-output/components → src/components`);
    }
    
    // 4b. Pages: migration-output/pages → src/app (USE EXISTING getAllJsFiles LOGIC)
    const pagesDir = path.join(migrationOutputDir, 'pages');
    if (await fs.pathExists(pagesDir)) {
      const appDir = path.join(nextjsAppPath, 'src', 'app');
      
      // Use the SAME getAllJsFiles function that works for shiftto
      const allPageFiles = getAllJsFiles(pagesDir);
      
      for (const filePath of allPageFiles) {
        const relativePath = path.relative(pagesDir, filePath);
        const fileName = path.basename(relativePath);
        const fileDir = path.dirname(relativePath);
        
        if (fileName === 'index.jsx' || fileName === 'index.js') {
          if (fileDir === '.') {
            // Root index → src/app/page.js
            await fs.copy(filePath, path.join(appDir, 'page.js'));
            console.log(`   • ${relativePath} → src/app/page.js`);
          } else {
            // Nested index → src/app/[dir]/page.js
            const targetDir = path.join(appDir, fileDir);
            await fs.ensureDir(targetDir);
            await fs.copy(filePath, path.join(targetDir, 'page.js'));
            console.log(`   • ${relativePath} → src/app/${fileDir}/page.js`);
          }
        } else if (fileName === '404.jsx' || fileName === '404.js') {
          // 404 → src/app/not-found.js
          await fs.copy(filePath, path.join(appDir, 'not-found.js'));
          console.log(`   • ${relativePath} → src/app/not-found.js`);
        } else if (!fileName.startsWith('[...') && !fileName.startsWith('_')) {
          // Regular pages with full nested support
          const name = path.basename(fileName, path.extname(fileName));
          let targetPath;
          
          if (fileDir === '.') {
            // Root level: about.jsx → src/app/about/page.js
            targetPath = path.join(appDir, name, 'page.js');
          } else {
            // Nested: blog/post.jsx → src/app/blog/post/page.js
            targetPath = path.join(appDir, fileDir, name, 'page.js');
          }
          
          await fs.ensureDir(path.dirname(targetPath));
          await fs.copy(filePath, targetPath);
          console.log(`   • ${relativePath} → src/app/${path.relative(appDir, targetPath)}`);
        }
      }
      
      // Generate layout.js
      const layoutContent = `import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: 'Migrated Next.js App',
  description: 'Generated by StackShifter',
};
`;
      await fs.writeFile(path.join(appDir, 'layout.js'), layoutContent);
      console.log(`   • Generated src/app/layout.js`);
      
      console.log(`✅ Pages: migration-output/pages → src/app (with nested support)`);
    }
    
    // 4c. Styles: migration-output/styles → styles (ROOT LEVEL)
    const stylesDir = path.join(migrationOutputDir, 'styles');
    if (await fs.pathExists(stylesDir)) {
      const targetStylesDir = path.join(nextjsAppPath, 'styles');
      await fs.copy(stylesDir, targetStylesDir);
      console.log(`✅ Styles: migration-output/styles → styles/`);
    }
    
    // 4d. Public: migration-output/public → public (ROOT LEVEL)
    const publicDir = path.join(migrationOutputDir, 'public');
    if (await fs.pathExists(publicDir)) {
      const targetPublicDir = path.join(nextjsAppPath, 'public');
      await fs.copy(publicDir, targetPublicDir, { overwrite: true });
      console.log(`✅ Assets: migration-output/public → public/`);
    }
    
    console.log('✅ All files copied to Next.js app structure');
    console.log('\n');
    
    // 5. Clean up migration-output folder (NEW)
    console.log('=== Step 5: Cleaning up migration-output folder ===');
    if (await fs.pathExists(tempMigrationOutput)) {
      await fs.remove(tempMigrationOutput);
      console.log('✅ Deleted migration-output folder');
    }
    console.log('\n');
    
    // 6. Install dependencies (SAME AS BEFORE)
    console.log('=== Step 6: Installing dependencies ===');
    await execCommand('npm install', { cwd: nextjsAppPath });
    console.log('✅ Dependencies installed');
    console.log('\n');
    
    // 7. Success message and start dev server (SAME AS BEFORE)
    console.log('🎉 Migration Complete!');
    console.log('====================');
    console.log(`Your Next.js app has been created at: ${nextjsAppPath}`);
    console.log('\nNext steps:');
    console.log(`1. cd ${nextjsAppPath}`);
    console.log('2. npm run dev');
    console.log('3. Open http://localhost:3000 in your browser');
    console.log('\n📝 Note: Review the migrated components for any manual adjustments needed.');
    
    // 8. Optionally start the dev server (SAME AS BEFORE)
    const shouldStart = process.env.AUTO_START !== 'false';
    if (shouldStart) {
      console.log('\n=== Step 7: Starting development server ===');
      console.log('🚀 Starting Next.js development server...');
      console.log('   Press Ctrl+C to stop the server');
      console.log('   Open http://localhost:3000 in your browser');
      await execCommand('npm run dev', { cwd: nextjsAppPath });
    }
    
  } catch (error) {
    console.error('\n❌ Migration Failed!');
    console.error('===================');
    console.error(`Error: ${error.message}`);
    
    // Cleanup on failure
    try {
      if (await fs.pathExists(tempMigrationOutput)) {
        await fs.remove(tempMigrationOutput);
        console.log('🗑️ Cleaned up temporary migration files');
      }
      
      if (await fs.pathExists(nextjsAppPath)) {
        console.log(`⚠️  Partial Next.js app may exist at: ${nextjsAppPath}`);
        console.log('   You may want to delete it manually if the migration failed early');
      }
    } catch (cleanupError) {
      console.error(`⚠️  Cleanup error: ${cleanupError.message}`);
    }
    
    process.exit(1);
  }
}