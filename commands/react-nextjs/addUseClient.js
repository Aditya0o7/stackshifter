import fs from 'fs-extra';
import path from 'path';
// import parser from '@babel/parser';
// import traverse from '@babel/traverse';

const CLIENT_HOOKS = [
  'useEffect',
  'useLayoutEffect',
  'useMemo',
  'useCallback',
  'useContext',
  'useState',
  'useLayoutEffect',
  'useReducer',
  'useImperativeHandle',
];
const CLIENT_APIS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
];


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

// Helper: Check if useEffect only does data fetching or pure calculation
// function isUseEffectSSRConvertible(src) {
//   try {
//     const ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
//     let convertible = false;
//     traverse(ast, {
//       CallExpression(path) {
//         if (
//           path.node.callee.name === 'useEffect' &&
//           path.node.arguments.length > 0
//         ) {
//           const effectFn = path.node.arguments[0];
//           if (
//             effectFn.type === 'ArrowFunctionExpression' ||
//             effectFn.type === 'FunctionExpression'
//           ) {
//             let onlyFetch = true;
//             let foundFetch = false;
//             path.traverse({
//               CallExpression(innerPath) {
//                 const callee = innerPath.node.callee;
//                 if (
//                   (callee.type === 'Identifier' && callee.name === 'fetch') ||
//                   (callee.type === 'MemberExpression' &&
//                     callee.object.name === 'axios' &&
//                     ['get', 'post', 'put', 'delete'].includes(callee.property.name))
//                 ) {
//                   foundFetch = true;
//                 } else if (
//                   callee.type === 'Identifier' &&
//                   !['fetch'].includes(callee.name)
//                 ) {
//                   onlyFetch = false;
//                 }
//               },
//               MemberExpression(innerPath) {
//                 // If any browser API is used, not convertible
//                 if (
//                   ['window', 'document', 'navigator', 'localStorage', 'sessionStorage'].includes(
//                     innerPath.node.object.name
//                   )
//                 ) {
//                   onlyFetch = false;
//                 }
//               }
//             });
//             if (foundFetch && onlyFetch) convertible = true;
//           }
//         }
//       }
//     });
//     return convertible;
//   } catch (e) {
//     return false;
//   }
// }

export default async function addUseClientDirective(outDir) {
  const TARGET_DIRS = [
    path.join(outDir, 'components'),
    path.join(outDir, 'pages'),
    path.join(outDir, 'pages-new')
  ];
  for (const dir of TARGET_DIRS) {
    const files = getAllJsFiles(dir);
    for (const file of files) {
      let src = fs.readFileSync(file, 'utf-8');
      // Skip if already has "use client"
      if (/^\s*["']use client["']/.test(src)) continue;

      // const hasUseEffect = /\buseEffect\b/.test(src);
      const hasOtherClientHook = CLIENT_HOOKS.some(hook =>
        new RegExp(`\\b${hook}\\b`).test(src)
      );
      const hasClientApi = CLIENT_APIS.some(api =>
        new RegExp(`\\b${api}\\b`).test(src)
      );

      // if (hasUseEffect && !hasOtherClientHook && !hasClientApi) {
      //   // Only useEffect, check if SSR convertible
      //   if (isUseEffectSSRConvertible(src)) {
      //     console.log(`⚡ SSR convertible candidate (useEffect data fetching only): ${file}`);
      //     // Optionally, write to a report file or flag for next step
      //     continue; // Don't add "use client" for now
      //   }
      // }

      // Otherwise, add "use client"
      if (hasOtherClientHook || hasClientApi) {
        src = `"use client";\n${src}`;
        fs.writeFileSync(file, src, 'utf-8');
        console.log(`Added "use client" to: ${file}`);
      }
    }
  }
  console.log('✅ "use client" directives added where needed');
}