import fs from 'fs-extra';
import path from 'path';

// Helper: Recursively get all JS/JSX/TSX files in a directory
function getAllJsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getAllJsFiles(full));
    } else if (
      full.endsWith('.js') ||
      full.endsWith('.jsx') ||
      full.endsWith('.tsx')
    ) {
      results.push(full);
    }
  });
  return results;
}

// Helper: Find a file by name (without extension) in a directory
function findFileByBasename(dir, basename) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (path.parse(file).name === basename) {
      return path.join(dir, file);
    }
  }
  return null;
}

function fixImportPathsInFile(filePath, componentsDir, stylesDir) {
  let src = fs.readFileSync(filePath, 'utf-8');
  // Regex for import statements
  const importRegex = /import\s+(\w+)\s+from\s+['"](.+)['"]/g;
  let match;
  let updated = false;

  while ((match = importRegex.exec(src)) !== null) {
    const importName = match[1];
    let importPath = match[2];

    // Only fix imports that are not from node_modules or absolute
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      let absImportPath = null;
      let found = false;

      // Try to resolve as component
      let base = path.basename(importPath, path.extname(importPath));
      let compFile = findFileByBasename(componentsDir, base);
      if (compFile) {
        absImportPath = compFile;
        found = true;
      }

      // Try to resolve as style (handle .css and .module.css)
      if (!found) {
        let styleBase = base.replace(/\.module$/, '');
        let styleFile = findFileByBasename(stylesDir, styleBase) ||
                        findFileByBasename(stylesDir, styleBase + '.module');
        if (styleFile) {
          absImportPath = styleFile;
          found = true;
        }
      }

      if (found) {
        let relPath = path.relative(path.dirname(filePath), absImportPath).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;
        // Always use forward slashes for imports
        src = src.replace(importPath, relPath);
        updated = true;
      }
    }
  }

  if (updated) fs.writeFileSync(filePath, src, 'utf-8');
}

// Exported main function for pipeline
export default async function correctImportPaths(outDir) {
  const pagesDir = path.join(outDir, 'pages');
  const componentsDir = path.join(outDir, 'components');
  const stylesDir = path.join(outDir, 'styles');

  const filesToFix = [
    ...getAllJsFiles(pagesDir),
    ...getAllJsFiles(componentsDir)
  ];

  for (const file of filesToFix) {
    fixImportPathsInFile(file, componentsDir, stylesDir);
  }

  console.log('✅ All import paths fixed!');
}