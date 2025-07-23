import fs from 'fs-extra';
import path from 'path';
import jscodeshift from 'jscodeshift';

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

// The transformer function (jscodeshift codemod)
function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let usesLink = false;
  let linkLocalName = null;

  // 1) Find the local name for Link imported from react-router-dom
  root.find(j.ImportDeclaration, { source: { value: 'react-router-dom' } })
    .forEach(path => {
      path.node.specifiers.forEach(spec => {
        if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Link') {
          linkLocalName = spec.local ? spec.local.name : 'Link';
        }
      });
    });

  // 2) Remove react-router-dom imports
  root.find(j.ImportDeclaration, { source: { value: 'react-router-dom' } })
    .remove();

  // 3) Rewrite only Link from react-router-dom to href and mark usage
  if (linkLocalName) {
    root.find(j.JSXOpeningElement, { name: { name: linkLocalName } })
      .forEach(path => {
        path.node.attributes.forEach(attr => {
          if (attr.name && attr.name.name === 'to') {
            attr.name.name = 'href';
            usesLink = true;
          }
        });
      });
  }

  // Helper: Recursively unwrap fragments
  function unwrapFragments(children) {
    return children.flatMap(child => {
      if (
        child.type === 'JSXElement' &&
        (
          (child.openingElement.name.type === 'JSXIdentifier' && child.openingElement.name.name === 'React.Fragment') ||
          (child.openingElement.name.type === 'JSXFragment')
        )
      ) {
        return unwrapFragments(child.children.filter(
          n => n.type !== 'JSXText' || n.value.trim() !== ''
        ));
      }
      return [child];
    });
  }

  // Helper: Unwrap a JSXElement by tag name (handles fragments)
  function unwrapTag(tag) {
    root.find(j.JSXElement, { openingElement: { name: { name: tag } } })
      .forEach(path => {
        let children = (path.node.children || []).filter(
          n => n.type !== 'JSXText' || n.value.trim() !== ''
        );
        children = unwrapFragments(children);

        // Clone children to avoid AST node reuse errors
        const clone = node => JSON.parse(JSON.stringify(node));

        if (children.length === 1) {
          j(path).replaceWith(clone(children[0]));
        } else if (children.length > 1) {
          j(path).replaceWith(...children.map(clone));
        } else {
          j(path).remove();
        }
      });
  }

  // 4) Unwrap <BrowserRouter> and <Routes> (recursively handles fragments)
  unwrapTag('BrowserRouter');
  unwrapTag('Routes');

  // 5) Replace <Route element={X}/> with X, warn if other props
  root.find(j.JSXElement, { openingElement: { name: { name: 'Route' } } })
    .forEach(path => {
      const attrs = path.node.openingElement.attributes;
      const elemAttr = attrs.find(a => a.name?.name === 'element');
      const otherAttrs = attrs.filter(a => a.name?.name !== 'element');
      if (elemAttr && elemAttr.value && elemAttr.value.expression) {
        // If there are other props, insert a comment warning
        if (otherAttrs.length > 0) {
          j(path).replaceWith(...[
            j.jsxExpressionContainer(
              j.identifier(`/* TODO: Review removed Route props: ${otherAttrs.map(a => a.name.name).join(', ')} */`)
            ),
            elemAttr.value.expression
          ]);
        } else {
          j(path).replaceWith(elemAttr.value.expression);
        }
      } else {
        // No element prop, just remove
        j(path).remove();
      }
    });

  // 6) Inject Next.js Link import if needed (preserve comments)
  if (usesLink) {
    const hasNextLink = root.find(j.ImportDeclaration, { source: { value: 'next/link' } }).size();
    if (!hasNextLink) {
      // Insert after any import statements and their comments
      const body = root.get().node.program.body;
      let insertIdx = 0;
      while (insertIdx < body.length && body[insertIdx].type === 'ImportDeclaration') {
        insertIdx++;
      }
      body.splice(insertIdx, 0,
        j.importDeclaration(
          [ j.importDefaultSpecifier(j.identifier('Link')) ],
          j.literal('next/link')
        )
      );
    }
  }

  return root.toSource({ quote: 'single' });
}

// Batch runner for migration-output/components and migration-output/pages-new
async function jsxLogicHandler(outDir) {
  const TARGET_DIRS = [
    path.join(outDir, 'components'),
    path.join(outDir, 'pages-new')
  ];
  for (const dir of TARGET_DIRS) {
    const files = getAllJsFiles(dir);
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      try {
        const output = transformer({ source: src, path: file }, { jscodeshift });
        if (output && output !== src) {
          fs.writeFileSync(file, output, 'utf8');
          console.log(`Transformed: ${file}`);
        }
      } catch (e) {
        console.error(`Error transforming ${file}:`, e.message);
      }
    }
  }
  // Move pages-new to pages after all transforms
  const pagesDir = path.join(outDir, 'pages');
  const pagesNewDir = path.join(outDir, 'pages-new');
  try {
    if (fs.existsSync(pagesDir)) {
      fs.rmSync(pagesDir, { recursive: true, force: true });
      console.log('Deleted old migration-output/pages folder.');
    }
    if (fs.existsSync(pagesNewDir)) {
      fs.moveSync(pagesNewDir, pagesDir, { overwrite: true });
      console.log('Moved migration-output/pages-new to migration-output/pages.');
    }
  } catch (err) {
    console.error('Error during pages folder migration:', err);
  }
  console.log('✅ jsxLogicHandler batch transform complete.');
}

export default jsxLogicHandler;