import fs from 'fs-extra';
import path from 'path';
import postcss from 'postcss';
import postcssSafeParser from 'postcss-safe-parser';

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

// Helper: Convert kebab-case to camelCase
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Build unique class map for a CSS file
function buildUniqueClassMap(classNames) {
  const classMap = {};
  const usedNames = new Set();

  for (const original of classNames) {
    let transformed = toCamelCase(original);
    let unique = transformed;
    let i = 2;
    while (usedNames.has(unique)) {
      unique = `${transformed}${i}`;
      i++;
    }
    classMap[original] = unique;
    usedNames.add(unique);
  }
  return classMap;
}

// Update CSS file and return mapping { original: uniqueCamelCase }
function updateCssFile(cssPath) {
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  const root = postcss.parse(cssContent, { parser: postcssSafeParser });

  // Collect all class selectors
  const classNames = [];
  root.walkRules(rule => {
    rule.selectors.forEach(selector => {
      const match = selector.match(/^\.(.+)/);
      if (match) {
        classNames.push(match[1]);
      }
    });
  });

  // Build unique class map
  const classMap = buildUniqueClassMap(classNames);

  // Apply mapping to selectors
  root.walkRules(rule => {
    rule.selectors = rule.selectors.map(selector => {
      const match = selector.match(/^\.(.+)/);
      if (match) {
        const original = match[1];
        const unique = classMap[original];
        return `.${unique}`;
      }
      return selector;
    });
  });

  fs.writeFileSync(cssPath, root.toString());
  return classMap;
}

// Update JSX file classnames according to mapping and import alias
function updateJsxFile(jsPath, cssImports) {
  let src = fs.readFileSync(jsPath, 'utf-8');
  for (const { importName, classMap, oldImport, newImport } of cssImports) {
    // Update import statement from .css to .module.css and add 'as styles' if needed
    if (oldImport && newImport && oldImport !== newImport) {
      // Replace import ... from './foo.css' with import styles from './foo.module.css'
      const importRegex = new RegExp(`import\\s+(\\w+)\\s+from\\s+['"]${oldImport}['"]`, 'g');
      src = src.replace(importRegex, `import ${importName} from '${newImport}'`);
    }
    // Replace styles['foo-bar'] and styles["foo-bar"]
    for (const [orig, unique] of Object.entries(classMap)) {
      const regex1 = new RegExp(`${importName}\\[['"\`]${orig}['"\`]\\]`, 'g');
      src = src.replace(regex1, `${importName}.${unique}`);
      // Replace styles.fooBar (if old code used camelCase already)
      const regex2 = new RegExp(`${importName}\\.${toCamelCase(orig)}`, 'g');
      src = src.replace(regex2, `${importName}.${unique}`);
      // Replace className="foo-bar" or className='foo-bar' with className={styles.fooBar}
      const regex3 = new RegExp(`className=["'\`]${orig}["'\`]`, 'g');
      src = src.replace(regex3, `className={${importName}.${unique}}`);
      // Replace className={"foo-bar"} or className={'foo-bar'}
      const regex4 = new RegExp(`className=\\{["'\`]${orig}["'\`]\\}`, 'g');
      src = src.replace(regex4, `className={${importName}.${unique}}`);
    }
  }
  fs.writeFileSync(jsPath, src);
}

// NEW: Handle side-effect CSS imports (import './foo.css';)
function updateJsxFileForSideEffectImport(jsPath, cssPath, classMap) {
  let src = fs.readFileSync(jsPath, 'utf-8');
  // Remove side-effect import
  const importRegex = new RegExp(`import\\s+['"]${cssPath}['"];?`, 'g');
  src = src.replace(importRegex, '');
  // Insert import styles from '...module.css';
  const cssModulePath = cssPath.replace(/\.css$/, '.module.css');
  src = `import styles from '${cssModulePath}';\n` + src;

  // Replace className="foo-bar" or className='foo-bar' with className={styles.fooBar}
  for (const [orig, unique] of Object.entries(classMap)) {
    const regex3 = new RegExp(`className=["'\`]${orig}["'\`]`, 'g');
    src = src.replace(regex3, `className={styles.${unique}}`);
    const regex4 = new RegExp(`className=\\{["'\`]${orig}["'\`]\\}`, 'g');
    src = src.replace(regex4, `className={styles.${unique}}`);
  }
  fs.writeFileSync(jsPath, src);
}

// Main logic
export default function fixClassNames(outDir) {
  const TARGET_DIRS = [
    path.join(outDir, 'components'),
    path.join(outDir, 'pages-new')
  ];
  for (const dir of TARGET_DIRS) {
    const files = getAllJsFiles(dir);
    for (const file of files) {
      let src = fs.readFileSync(file, 'utf-8');
      // Find all CSS imports: import styles from './foo.css' or './foo.module.css'
      const importRegex = /import\s+(\w+)\s+from\s+['"](.+?\.css)['"]/g;
      let match;
      const cssImports = [];
      while ((match = importRegex.exec(src)) !== null) {
        const importName = match[1];
        let cssPath = match[2];
        // Always look for .module.css on disk
        const cssModulePath = cssPath.replace(/\.css$/, '.module.css');
        const absCssPath = path.resolve(path.dirname(file), cssModulePath);
        if (fs.existsSync(absCssPath)) {
          const classMap = updateCssFile(absCssPath);
          cssImports.push({
            importName,
            classMap,
            oldImport: cssPath,
            newImport: cssModulePath
          });
        }
      }
      if (cssImports.length > 0) {
        updateJsxFile(file, cssImports);
        console.log(`Fixed classnames and imports in: ${file}`);
      }

      // Handle side-effect CSS imports: import './foo.css';
      const sideEffectImportRegex = /import\s+['"](.+?\.css)['"];?/g;
      let sideMatch;
      while ((sideMatch = sideEffectImportRegex.exec(src)) !== null) {
        let cssPath = sideMatch[1];
        const cssModulePath = cssPath.replace(/\.css$/, '.module.css');
        const absCssPath = path.resolve(path.dirname(file), cssModulePath);
        if (fs.existsSync(absCssPath)) {
          const classMap = updateCssFile(absCssPath);
          updateJsxFileForSideEffectImport(file, cssPath, classMap);
          console.log(`Fixed side-effect import and classnames in: ${file}`);
        }
      }
    }
  }
  console.log('✅ All classnames and imports fixed!');
}