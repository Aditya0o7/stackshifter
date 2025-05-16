import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import postcssSafeParser from 'postcss-safe-parser';
import { fileURLToPath } from 'url';

function transformCss() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Directories
  const stylesInputDir = path.join(__dirname, 'migration-output', 'styles');
  const changedTagsOutputDir = path.join(__dirname, 'migration-output', 'css-metadata');

  // Ensure output dir exists
  if (!fs.existsSync(changedTagsOutputDir)) fs.mkdirSync(changedTagsOutputDir, { recursive: true });

  // Helper to sanitize class names to camelCase
  function sanitizeClassName(name) {
    return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  fs.readdirSync(stylesInputDir).forEach((file) => {
    if (!file.endsWith('.module.css')) return;

    const filePath = path.join(stylesInputDir, file);
    const cssContent = fs.readFileSync(filePath, 'utf-8');
    const root = postcss.parse(cssContent, { parser: postcssSafeParser });

    const classMap = {};
    const transformedNames = new Set();
    const collisions = [];

    root.walkRules((rule) => {
      rule.selectors = rule.selectors.map((selector) => {
        const classMatch = selector.match(/^\.(.+)/);
        if (classMatch) {
          const original = classMatch[1];
          const transformed = sanitizeClassName(original);

          if (transformedNames.has(transformed) && classMap[original] !== transformed) {
            collisions.push({ original, transformed });
          } else {
            transformedNames.add(transformed);
            classMap[original] = transformed;
          }

          return `.${transformed}`;
        }
        return selector;
      });
    });

    // Log collision warnings
    if (collisions.length > 0) {
      console.warn(`⚠️  COLLISIONS in ${file}:`);
      collisions.forEach(({ original, transformed }) => {
        console.warn(`  - ${original} and another class map to the same name: ${transformed}`);
      });
    }

    // Overwrite the file with updated CSS
    fs.writeFileSync(filePath, root.toString());

    // Save the class map
    const jsonFilePath = path.join(
      changedTagsOutputDir,
      file.replace('.module.css', '-changed-tagnames.json')
    );
    fs.writeFileSync(jsonFilePath, JSON.stringify(classMap, null, 2));

    console.log(`Processed ${file} and saved class map to ${path.basename(jsonFilePath)}`);
  });
}

transformCss();
