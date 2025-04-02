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

function createUASTNode(type, properties) {
  return t.objectExpression([
    t.objectProperty(t.identifier('type'), t.stringLiteral(type)),
    ...Object.entries(properties).map(([key, value]) => 
      t.objectProperty(t.identifier(key), value))
  ]);
}

// Nodes that should not be transformed to UAST format
const PRESERVE_AS_BAEL_NODES = new Set([
  'VariableDeclarator',
  'FunctionDeclaration',
  'ImportDeclaration',
  'ExportNamedDeclaration',
  'ExportDefaultDeclaration'
]);

function transformJSXToUAST(ast) {
  traverse(ast, {
    enter(path) {
      // Skip nodes that need to remain as Babel AST nodes
      if (PRESERVE_AS_BAEL_NODES.has(path.node.type)) {
        return;
      }

      // Skip already transformed nodes
      if (path.isObjectExpression() && 
          path.node.properties.some(p => 
            t.isObjectProperty(p) && 
            t.isIdentifier(p.key) && 
            p.key.name === 'type' &&
            t.isStringLiteral(p.value) &&
            p.value.value.startsWith('UAST_')
          )) {
        return;
      }

      // Handle JSX-specific nodes
      if (path.isJSXElement()) {
        const openingElement = path.get('openingElement').node;
        const children = path.get('children').map(c => c.node);
        const closingElement = path.get('closingElement').node;
        
        path.replaceWith(
          createUASTNode('UAST_JSXElement', {
            openingElement: openingElement,
            children: t.arrayExpression(children),
            closingElement: closingElement
          })
        );
        path.skip();
      }
      else if (path.isJSXOpeningElement()) {
        path.replaceWith(
          createUASTNode('UAST_OpenTag', {
            name: path.node.name,
            attributes: t.arrayExpression(path.node.attributes),
            selfClosing: t.booleanLiteral(path.node.selfClosing)
          })
        );
        path.skip();
      }
      else if (path.isJSXClosingElement()) {
        path.replaceWith(
          createUASTNode('UAST_CloseTag', {
            name: path.node.name
          })
        );
        path.skip();
      }
      else if (path.isJSXFragment()) {
        path.replaceWith(
          createUASTNode('UAST_Fragment', {
            children: t.arrayExpression(path.node.children)
          })
        );
        path.skip();
      }
      else if (path.isJSXAttribute()) {
        path.replaceWith(
          createUASTNode('UAST_Attr', {
            name: t.stringLiteral(path.node.name.name),
            value: path.node.value || t.nullLiteral()
          })
        );
        path.skip();
      }
      else if (path.isJSXSpreadAttribute()) {
        path.replaceWith(
          createUASTNode('UAST_SpreadAttr', {
            argument: path.node.argument
          })
        );
        path.skip();
      }
      else if (path.isJSXText()) {
        const value = path.node.value.trim();
        if (value) {
          path.replaceWith(
            createUASTNode('UAST_Text', {
              value: t.stringLiteral(value)
            })
          );
          path.skip();
        } else {
          path.remove();
        }
      }
      else if (path.isJSXExpressionContainer()) {
        path.replaceWith(
          createUASTNode('UAST_Expr', {
            expression: path.node.expression
          })
        );
        path.skip();
      }
      else if (path.isJSXSpreadChild()) {
        path.replaceWith(
          createUASTNode('UAST_SpreadChild', {
            expression: path.node.expression
          })
        );
        path.skip();
      }
      else if (path.isJSXEmptyExpression()) {
        path.replaceWith(
          createUASTNode('UAST_EmptyExpr', {})
        );
        path.skip();
      }
      else if (path.isJSXIdentifier()) {
        path.replaceWith(
          createUASTNode('UAST_Identifier', {
            name: t.stringLiteral(path.node.name)
          })
        );
        path.skip();
      }
      else if (path.isJSXMemberExpression()) {
        path.replaceWith(
          createUASTNode('UAST_MemberExpr', {
            object: path.node.object,
            property: path.node.property
          })
        );
        path.skip();
      }
      else if (path.isJSXNamespacedName()) {
        path.replaceWith(
          createUASTNode('UAST_NamespacedName', {
            namespace: path.node.namespace,
            name: path.node.name
          })
        );
        path.skip();
      }
      else if (path.isCallExpression() && t.isIdentifier(path.node.callee)) {
        const hookNames = ['useState', 'useEffect', 'useRef', 'useContext', 'useReducer'];
        const calleeName = path.node.callee.name;
        
        if (hookNames.includes(calleeName)) {
          path.replaceWith(
            createUASTNode(`UAST_${capitalize(calleeName)}`, {
              arguments: t.arrayExpression(path.node.arguments)
            })
          );
          path.skip();
        }
      }
      else if (path.isIdentifier() && 
               !path.findParent(p => 
                 p.isJSXIdentifier() || 
                 p.isJSXMemberExpression() ||
                 p.isJSXNamespacedName()
               )) {
        path.replaceWith(
          createUASTNode('UAST_Identifier', {
            name: t.stringLiteral(path.node.name)
          })
        );
        path.skip();
      }
      else if (path.isLiteral()) {
        path.replaceWith(
          createUASTNode('UAST_Literal', {
            value: path.node
          })
        );
        path.skip();
      }
    }
  });

  // Second pass to handle declarations after their children are transformed
  traverse(ast, {
VariableDeclaration(path) {
  path.node.declarations.forEach(decl => {
    decl.id = createUASTNode('UAST_Identifier', {
      name: t.stringLiteral(decl.id.name),
    });
  });

  path.replaceWith(
    createUASTNode('UAST_VarDecl', {
      declarations: t.arrayExpression(path.node.declarations),
      kind: t.stringLiteral(path.node.kind),
    })
  );
},
    FunctionDeclaration(path) {
      path.replaceWith(
        createUASTNode('UAST_FuncDecl', {
          id: path.node.id,
          params: t.arrayExpression(path.node.params),
          body: path.node.body,
          async: t.booleanLiteral(path.node.async)
        })
      );
    },
    ImportDeclaration(path) {
      path.replaceWith(
        createUASTNode('UAST_Import', {
          specifiers: t.arrayExpression(path.node.specifiers),
          source: path.node.source
        })
      );
    },
    ExportNamedDeclaration(path) {
      path.replaceWith(
        createUASTNode('UAST_ExportNamed', {
          declaration: path.node.declaration || t.nullLiteral(),
          specifiers: t.arrayExpression(path.node.specifiers),
          source: path.node.source || t.nullLiteral()
        })
      );
    },
    ExportDefaultDeclaration(path) {
      path.replaceWith(
        createUASTNode('UAST_ExportDefault', {
          declaration: path.node.declaration
        })
      );
    }
  });
}

transformJSXToUAST(ast);

console.log(JSON.stringify(ast, null, 2));