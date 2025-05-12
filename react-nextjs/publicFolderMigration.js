/*
 * Script: copyPublic.js
 * Purpose: Automate copying Vite React "public/" assets into migration-output/public/
 * Excludes index.html (Next.js provides its own HTML template)
 * Usage: node copyPublic.js [sourcePublicDir] [destPublicDir]
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Workaround for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read source and destination from CLI args (with defaults)
const [,, srcDir = './sample-react-app/public', destDir = './migration-output/public'] = process.argv;

async function copyPublicAssets() {
  try {
    const absoluteSrc = path.resolve(__dirname, srcDir);
    const absoluteDest = path.resolve(__dirname, destDir);

    // Ensure destination exists
    await fs.ensureDir(absoluteDest);

    // Copy all files except index.html
    await fs.copy(absoluteSrc, absoluteDest, {
      filter: (src) => {
        const base = path.basename(src);
        return base !== 'index.html';
      }
    });

    
    return true;
  } catch (err) {
    
    process.exit(1);
    return false;
  }
}

export default copyPublicAssets;