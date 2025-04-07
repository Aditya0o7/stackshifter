import * as babel from "@babel/core";
import _traverse from "@babel/traverse";
import * as t from '@babel/types';
import parser from "@babel/parser";
import fs from "fs";
import transformNode from "./transformNode.js";
import normalizeJSX from "./normalizeJSX.js";

const traverse = _traverse.default;

const jsxCode = fs.readFileSync("./sample.jsx", "utf-8");

const ast = parser.parse(jsxCode, {
  sourceType: "module",
  plugins: ["jsx"],
});

const normalizedAst = normalizeJSX(ast);

function literalFor(value) {
  if (typeof value === 'string') return t.stringLiteral(value);
  if (typeof value === 'number') return t.numericLiteral(value);
  if (typeof value === 'boolean') return t.booleanLiteral(value);
  if (value === null) return t.nullLiteral();
  if (Array.isArray(value)) {
    return t.arrayExpression(value.map(literalFor));
  }
  if (typeof value === 'object') {
    return t.objectExpression(
      Object.entries(value).map(([k, v]) =>
        t.objectProperty(t.identifier(k), literalFor(v))
      )
    );
  }
  return t.stringLiteral(String(value));
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function transformJSXToUAST(ast) {
  traverse(ast, {
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
    VariableDeclaration(path) {
      const transformedDecls = path.node.declarations.map(dec => transformNode(dec));
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(t.identifier('type'), t.stringLiteral('UAST_VarDecl')),
          t.objectProperty(
            t.identifier('declarations'),
            t.arrayExpression(
              transformedDecls.map(transformed =>
                t.objectExpression(
                  Object.entries(transformed).map(([key, value]) =>
                    t.objectProperty(t.identifier(key), literalFor(value))
                  )
                )
              )
            )
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
      const reactHooks = ['useState', 'useEffect', 'useRef', 'useContext', 'useReducer'];
      const newType = reactHooks.includes(calleeName)
        ? `UAST_${capitalize(calleeName)}`
        : 'UAST_CallExpr';
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
  });
}

transformJSXToUAST(normalizedAst);
fs.writeFileSync('./output_uast.json', JSON.stringify(normalizedAst, null, 2));
console.log('✅ UAST written to output_uast.json');
