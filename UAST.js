import * as babel from "@babel/core";
import _traverse from "@babel/traverse";
import * as t from '@babel/types';
import parser from "@babel/parser";
import fs from "fs";

const traverse = _traverse.default;

const jsxCode = fs.readFileSync("./sample.jsx", "utf-8");

const ast = parser.parse(jsxCode, {
  sourceType: "module",
  plugins: ["jsx"],
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const visitedNodes = new WeakSet();

function transformNode(node) {
  if (!node) return t.nullLiteral();
  if (typeof node !== 'object') return node;

  // Prevent infinite recursion: if already visited, return as is.
  if (visitedNodes.has(node)) return node;
  visitedNodes.add(node);

  // Already transformed UAST node: if it's an object with a UAST type, return it.
  if (t.isObjectExpression(node)) {
    const typeProp = node.properties.find(
      prop => t.isIdentifier(prop.key) && prop.key.name === 'type'
    );
    if (
      typeProp &&
      t.isStringLiteral(typeProp.value) &&
      typeProp.value.value.startsWith('UAST_')
    ) {
      return node;
    }
  }

  if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node)) {
    return node;
  }
  if (t.isIdentifier(node)) {
    return t.stringLiteral(node.name);
  }
  if (t.isVariableDeclarator(node)) {
    return t.objectExpression([
      t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_VarDeclarator')),
      t.objectProperty(t.identifier('id'), transformNode(node.id)),
      t.objectProperty(t.identifier('init'), node.init ? transformNode(node.init) : t.nullLiteral()),
    ]);
  }
  if (t.isImportDefaultSpecifier(node)) {
    return t.objectExpression([
      t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_ImportDefaultSpecifier')),
      t.objectProperty(t.identifier('local'), transformNode(node.local)),
    ]);
  }
  if (t.isImportSpecifier(node)) {
    return t.objectExpression([
      t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_ImportSpecifier')),
      t.objectProperty(t.identifier('imported'), transformNode(node.imported)),
      t.objectProperty(t.identifier('local'), transformNode(node.local)),
    ]);
  }
  if (t.isImportNamespaceSpecifier(node)) {
    return t.objectExpression([
      t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_ImportNamespaceSpecifier')),
      t.objectProperty(t.identifier('local'), transformNode(node.local)),
    ]);
  }
  if (Array.isArray(node)) {
    return t.arrayExpression(node.map(transformNode));
  }
  // Fallback: if node is already an Expression, return as is.
  return node;
}

function transformJSXToUAST(ast) {
  traverse(ast, {
    // Core JSX Elements
    JSXOpeningElement(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_OpenTag')),
          t.objectProperty(t.identifier('name'), transformNode(path.node.name)),
          t.objectProperty(
            t.identifier('attributes'),
            t.arrayExpression(path.node.attributes.map(attr => transformNode(attr)))
          ),
        ])
      );
    },
    JSXClosingElement(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_CloseTag')),
          t.objectProperty(t.identifier('name'), transformNode(path.node.name)),
        ])
      );
    },
    JSXAttribute(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Attr')),
          t.objectProperty(t.identifier('name'), t.stringLiteral(path.node.name.name)),
          t.objectProperty(
            t.identifier('value'),
            path.node.value ? transformNode(path.node.value) : t.nullLiteral()
          ),
        ])
      );
    },
    JSXText(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Text')),
          t.objectProperty(t.identifier('value'), t.stringLiteral(path.node.value)),
        ])
      );
    },
    JSXFragment(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Fragment')),
          t.objectProperty(
            t.identifier('children'),
            t.arrayExpression(path.node.children.map(child => transformNode(child)))
          ),
        ])
      );
    },

    // JSX Expressions & Spread Elements
    JSXExpressionContainer(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Expr')),
          t.objectProperty(t.identifier('expression'), transformNode(path.node.expression)),
        ])
      );
    },
    JSXSpreadAttribute(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_SpreadAttr')),
          t.objectProperty(t.identifier('argument'), transformNode(path.node.argument)),
        ])
      );
    },
    JSXSpreadChild(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_SpreadChild')),
          t.objectProperty(t.identifier('expression'), transformNode(path.node.expression)),
        ])
      );
    },

    // JavaScript Structures Inside JSX
    VariableDeclaration(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_VarDecl')),
          t.objectProperty(
            t.identifier('declarations'),
            t.arrayExpression(path.node.declarations.map(dec => transformNode(dec)))
          ),
          t.objectProperty(t.identifier('kind'), t.stringLiteral(path.node.kind)),
        ])
      );
    },
    ArrowFunctionExpression(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Func')),
          t.objectProperty(
            t.identifier('params'),
            t.arrayExpression(path.node.params.map(para => transformNode(para)))
          ),
          t.objectProperty(t.identifier('body'), transformNode(path.node.body)),
          t.objectProperty(t.identifier('async'), t.booleanLiteral(path.node.async)),
        ])
      );
    },
    FunctionDeclaration(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_FuncDecl')),
          t.objectProperty(t.identifier('id'), path.node.id ? transformNode(path.node.id) : t.nullLiteral()),
          t.objectProperty(
            t.identifier('params'),
            t.arrayExpression(path.node.params.map(para => transformNode(para)))
          ),
          t.objectProperty(t.identifier('body'), transformNode(path.node.body)),
          t.objectProperty(t.identifier('async'), t.booleanLiteral(path.node.async)),
        ])
      );
    },
    ImportDeclaration(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Import')),
          t.objectProperty(
            t.identifier('specifiers'),
            t.arrayExpression(path.node.specifiers.map(spec => transformNode(spec)))
          ),
          t.objectProperty(t.identifier('source'), transformNode(path.node.source)),
        ])
      );
    },
    ExportNamedDeclaration(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_ExportNamed')),
          t.objectProperty(t.identifier('declaration'), path.node.declaration ? transformNode(path.node.declaration) : t.nullLiteral()),
          t.objectProperty(
            t.identifier('specifiers'),
            t.arrayExpression(path.node.specifiers.map(spec => transformNode(spec)))
          ),
          t.objectProperty(t.identifier('source'), path.node.source ? transformNode(path.node.source) : t.nullLiteral()),
        ])
      );
    },
    ExportDefaultDeclaration(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_ExportDefault')),
          t.objectProperty(t.identifier('declaration'), transformNode(path.node.declaration)),
        ])
      );
    },
    ReturnStatement(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier("type"), t.stringLiteral("UAST_Return")),
          t.objectProperty(t.identifier("argument"), transformNode(path.node.argument)),
        ])
      );
    },
    CallExpression(path) {
      const calleeName = path.node.callee.name;
      let newType;

      if (['useState', 'useEffect', 'useRef', 'useContext', 'useReducer'].includes(calleeName)) {
        newType = `UAST_${capitalize(calleeName)}`;
      } else {
        newType = 'UAST_CallExpr';
      }

      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral(newType)),
          t.objectProperty(t.identifier('callee'), transformNode(path.node.callee)),
          t.objectProperty(
            t.identifier('arguments'),
            t.arrayExpression(path.node.arguments.map(arg => transformNode(arg)))
          ),
        ])
      );
    },
    MemberExpression(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier("type"), t.stringLiteral("UAST_MemberExpr")),
          t.objectProperty(t.identifier("object"), transformNode(path.node.object)),
          t.objectProperty(t.identifier("property"), transformNode(path.node.property)),
        ])
      );
    },
    StringLiteral(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Literal')),
          t.objectProperty(t.identifier('value'), t.stringLiteral(path.node.value)),
        ])
      );
    },
    NumericLiteral(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Literal')),
          t.objectProperty(t.identifier('value'), t.numericLiteral(path.node.value)),
        ])
      );
    },
    BooleanLiteral(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Literal')),
          t.objectProperty(t.identifier('value'), t.booleanLiteral(path.node.value)),
        ])
      );
    },
    NullLiteral(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Literal')),
          t.objectProperty(t.identifier('value'), t.nullLiteral()),
        ])
      );
    },
    JSXIdentifier(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_Identifier')),
          t.objectProperty(t.identifier('name'), t.stringLiteral(path.node.name)),
        ])
      );
    },
    JSXMemberExpression(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_MemberExpr')),
          t.objectProperty(t.identifier('object'), transformNode(path.node.object)),
          t.objectProperty(t.identifier('property'), transformNode(path.node.property)),
        ])
      );
    },
    JSXNamespacedName(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_NamespacedName')),
          t.objectProperty(t.identifier('namespace'), transformNode(path.node.namespace)),
          t.objectProperty(t.identifier('name'), transformNode(path.node.name)),
        ])
      );
    },
    JSXEmptyExpression(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_EmptyExpr')),
        ])
      );
    },
  });
}

transformJSXToUAST(ast);

console.log(JSON.stringify(ast, null, 2));
