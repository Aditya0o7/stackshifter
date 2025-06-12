import fs from 'fs-extra';
import path from 'path';

async function handleStyles(src = './sample-react-app/src/styles', dest = './migration-output/styles') {
  const absoluteSrc = path.resolve(src);
  const absoluteDest = path.resolve(dest);

  try {
    // Ensure source exists
    if (!await fs.pathExists(absoluteSrc)) {
      console.error(`Source directory does not exist: ${absoluteSrc}`);
      return;
    }

    // Ensure destination exists
    await fs.ensureDir(absoluteDest);

    // Recursively read source directory
    const files = await fs.readdir(absoluteSrc);
    for (const file of files) {
      const srcPath = path.join(absoluteSrc, file);
      const stat = await fs.stat(srcPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectories
        await handleStyles(srcPath, path.join(absoluteDest, file));
      } else if (stat.isFile() && path.extname(file) === '.css') {
        // Construct new filename: <name>.module.css
        const name = path.basename(file, '.css');
        const destFile = `${name}.module.css`;
        const destPath = path.join(absoluteDest, destFile);

        // Copy file
        await fs.copy(srcPath, destPath);
        console.log(`✅ Migrated: ${srcPath} → ${destPath}`);
      }
    }
    console.log('✅ Style migration complete.');
  } catch (err) {
    console.error('❌ Error during style migration:', err);
  }
}

export default handleStyles;