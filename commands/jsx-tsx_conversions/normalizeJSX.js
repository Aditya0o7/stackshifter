import _traverse from "@babel/traverse";
import * as t from "@babel/types";

const traverse = _traverse.default;

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

export default normalizeJSX;
