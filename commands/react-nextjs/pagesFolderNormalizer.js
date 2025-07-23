import fs from 'fs-extra';
import path from 'path';
import parser from '@babel/parser';
import babelTraverse from '@babel/traverse';
const traverse = babelTraverse.default;

function routeToFilePath(route) {
  let parts = route.replace(/^\/+/, '').split('/');
  parts = parts.map(p =>
    p.startsWith(':') ? `[${p.slice(1)}]` : (p === '*' ? '[...slug]' : p)
  );
  if (route === '/' || route === '') return 'index.jsx';
  if (route.endsWith('/')) parts.push('index');
  return path.join(...parts) + '.jsx';
}

function getAllFiles(dir, ext = '.jsx') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getAllFiles(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  });
  return results;
}

function parseRoutesFromFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (e) {
    console.warn(`Could not parse ${filePath}: ${e.message}`);
    return [];
  }
  const routes = [];
  traverse(ast, {
    JSXElement(path) {
      const opening = path.node.openingElement;
      if (
        opening.name.type === 'JSXIdentifier' &&
        opening.name.name === 'Route'
      ) {
        let routePath = null;
        let elementName = null;
        let elementFile = filePath;
        opening.attributes.forEach(attr => {
          if (attr.name && attr.name.name === 'path' && attr.value) {
            routePath = attr.value.value;
          }
          if (attr.name && attr.name.name === 'element' && attr.value) {
            if (
              attr.value.expression &&
              attr.value.expression.type === 'JSXElement'
            ) {
              const comp = attr.value.expression.openingElement.name;
              if (comp.type === 'JSXIdentifier') {
                elementName = comp.name;
              }
            }
          }
        });
        if (routePath && elementName) {
          routes.push({
            routePath,
            elementName,
            elementFile,
          });
        }
      }
    },
  });
  return routes;
}

function buildRouteMap(outDir) {
  const SRC_PAGES_DIR = path.join(outDir, 'pages');
  const files = getAllFiles(SRC_PAGES_DIR);
  const routeMap = {};
  for (const file of files) {
    const routes = parseRoutesFromFile(file);
    for (const r of routes) {
      if (!routeMap[r.routePath]) routeMap[r.routePath] = [];
      routeMap[r.routePath].push({
        component: r.elementName,
        file: file,
      });
    }
  }
  return routeMap;
}

function findComponentFile(componentName, outDir) {
  const SRC_PAGES_DIR = path.join(outDir, 'pages');
  const COMPONENTS_DIR = path.join(outDir, 'components');
  const searchDirs = [SRC_PAGES_DIR, COMPONENTS_DIR];
  for (const dir of searchDirs) {
    const files = getAllFiles(dir);
    for (const file of files) {
      const code = fs.readFileSync(file, 'utf8');
      if (
        code.includes(`export default ${componentName}`) ||
        code.includes(`export { ${componentName} as default }`) ||
        code.includes(`function ${componentName}`) ||
        code.includes(`const ${componentName} =`)
      ) {
        return file;
      }
    }
  }
  return null;
}

async function pagesFolderNormalizer(outDir) {
  const SRC_PAGES_DIR = path.join(outDir, 'pages');
  const OUTPUT_PAGES_DIR = path.join(outDir, 'pages-new');

  const routeMap = buildRouteMap(outDir);
  fs.ensureDirSync(OUTPUT_PAGES_DIR);

  // Debug: log all detected routes
  console.log('Detected routes:', Object.keys(routeMap));

  let foundCatchAll = false;
  let catchAllComponent = null;

  for (const [route, arr] of Object.entries(routeMap)) {
    let filePaths = [routeToFilePath(route)];
    if (route === '*') {
      filePaths.push('404.jsx');
      foundCatchAll = true;
      catchAllComponent = arr[0]?.component;
    }

    for (const filePath of filePaths) {
      const outFile = path.join(OUTPUT_PAGES_DIR, filePath);
      fs.ensureDirSync(path.dirname(outFile));

      if (arr.length > 1) {
        console.warn(
          `Route "${route}" is mapped to multiple components: ${arr
            .map(a => a.component)
            .join(', ')}. Manual review needed.`
        );
        continue;
      }

      const { component, file } = arr[0];
      const compFile = findComponentFile(component, outDir);

      if (!compFile) {
        console.warn(
          `Could not find file for component "${component}" (route: "${route}").`
        );
        continue;
      }

      if (path.resolve(compFile) === path.resolve(outFile)) {
        continue;
      }

      const usedInRoutes = Object.values(routeMap)
        .flat()
        .filter(a => a.component === component);
      const compBase = path.basename(compFile);
      const compTarget = path.join(OUTPUT_PAGES_DIR, '..', 'components', compBase);
      if (!fs.existsSync(compTarget)) {
        fs.copyFileSync(compFile, compTarget);
      }
      fs.writeFileSync(
        outFile,
        `import ${component} from '../../components/${compBase}';\nexport default ${component};\n`
      );
      console.log(`Mapped route "${route}" to "${outFile}"`);
    }
  }

  // Fallback: If no catch-all route was found, create default [...slug].jsx and 404.jsx
  const catchAllPath = path.join(OUTPUT_PAGES_DIR, '[...slug].jsx');
  const notFoundPath = path.join(OUTPUT_PAGES_DIR, '404.jsx');
  if (!foundCatchAll) {
    if (!fs.existsSync(catchAllPath)) {
      fs.writeFileSync(
        catchAllPath,
        `export default function CatchAll() { return <div>Not Found</div>; }`
      );
      console.log('Created default catch-all: [...slug].jsx');
    }
    if (!fs.existsSync(notFoundPath)) {
      fs.writeFileSync(
        notFoundPath,
        `export default function NotFound() { return <div>404 - Not Found</div>; }`
      );
      console.log('Created default 404: 404.jsx');
    }
  } else {
    // If catch-all route was found, ensure both files exist and use the correct component
    let importLine;
    if (catchAllComponent) {
      const compFile = findComponentFile(catchAllComponent, outDir);
      if (compFile) {
        const compBase = path.basename(compFile);
        const compTarget = path.join(OUTPUT_PAGES_DIR, '..', 'components', compBase);
        if (!fs.existsSync(compTarget)) {
          fs.copyFileSync(compFile, compTarget);
          console.log(`Copied catch-all component to components: ${compTarget}`);
        }
        importLine = `import ${catchAllComponent} from '../../components/${compBase}';\nexport default ${catchAllComponent};\n`;
      } else {
        importLine = `export default function CatchAll() { return <div>Not Found</div>; }`;
      }
    } else {
      importLine = `export default function CatchAll() { return <div>Not Found</div>; }`;
    }
    if (!fs.existsSync(catchAllPath)) {
      fs.writeFileSync(catchAllPath, importLine);
      console.log('Created catch-all: [...slug].jsx');
    }
    if (!fs.existsSync(notFoundPath)) {
      fs.writeFileSync(notFoundPath, importLine);
      console.log('Created 404: 404.jsx');
    }
  }

  console.log('✅ Migration complete. Review migration-output/pages-new/ for your new Next.js pages.');
}

export default pagesFolderNormalizer;