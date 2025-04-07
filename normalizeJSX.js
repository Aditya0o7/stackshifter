
import parser from "@babel/parser";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";
// const jsxCode = `
// const App = () => (
//   <>
//     <h1>Hello, World!</h1>
//     <p>{/* comment */}</p>
//     <span>    </span>
//     <br />
//   </>
// );
// `;

const traverse = _traverse.default;
// const ast = parser.parse(jsxCode, {
//   sourceType: 'module',
//   plugins: ['jsx'],
// });

function normalizeJSX(ast) {
  traverse(ast, {
    JSXText(path) {
      if (path.node.value.trim() === '') {
        path.remove();
      }
    },
    JSXFragment(path) {
      const spanEl = t.jSXElement(
        t.jSXOpeningElement(
          t.jSXIdentifier('span'),
          [t.jSXAttribute(t.jSXIdentifier('data-fragment'))],
          false
        ),
        t.jSXClosingElement(t.jSXIdentifier('span')),
        path.node.children
      );
      path.replaceWith(spanEl);
    },
    JSXExpressionContainer(path) {
      const expr = path.node.expression;
      if (t.isJSXEmptyExpression(expr)) {
        path.remove();
      } else if (t.isStringLiteral(expr)) {
        path.replaceWith(t.jSXText(expr.value));
      } else if (expr.type === 'JSXComment') {
        path.remove();
      }
    },
  });

  return ast;
}

// Log AST
// console.log(JSON.stringify(ast, null, 2));

// console.log("..................................................");

// const normalizedAST = normalizeJSX(ast);
// console.log(JSON.stringify(normalizedAST, null, 2));
export default normalizeJSX;
