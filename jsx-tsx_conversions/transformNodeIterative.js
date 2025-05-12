import pkg from '@babel/types';
const { types: t } = pkg;

// Utility: Capitalize function remains the same
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

// Trampoline helper to simulate tail-call optimization
function trampoline(fn) {
  while (typeof fn === 'function') {
    fn = fn();
  }
  return fn;
}

// Deeply transform an unhandled node by recursing through its properties,
// stripping out Babel metadata (start, end, loc) and transforming subnodes.
function deepTransform(node, _transform, cont) {
  const result = {};
  for (const key in node) {
    if (['start', 'end', 'loc'].includes(key)) continue;
    const val = node[key];
    if (Array.isArray(val)) {
      // Process each element if it's an object with a type
      result[key] = val.map(item =>
        (item && typeof item === 'object' && item.type)
          ? trampoline(() => _transform(item, r => r))
          : item
      );
    } else if (val && typeof val === 'object' && val.type) {
      result[key] = trampoline(() => _transform(val, r => r));
    } else {
      result[key] = val;
    }
  }
  return cont(result);
}

// Tail-call optimized transformer using trampoline
// Converts a Babel AST node into your UAST format.
function transformNodeTCO(node) {
  function _transform(node, cont) {
    if (!node || typeof node !== 'object') return cont(node);
    switch (node.type) {
      // JSX element and its parts
      case 'JSXElement':
        return () => _transform(node.openingElement, opening =>
          _transformArray(node.children, children =>
            _transform(node.closingElement, closing =>
              cont({
                type: 'UAST_Element',
                opening,
                children,
                closing: closing || null
              })
            )
          )
        );
      case 'JSXOpeningElement':
        return () => _transform(node.name, name =>
          _transformArray(node.attributes, attrs =>
            cont({ 
              type: 'UAST_OpenTag', 
              name, 
              attributes: attrs,
              selfClosing: node.selfClosing || false
             })
          )
        );
      case 'JSXClosingElement':
        return () => _transform(node.name, name =>
          cont({ type: 'UAST_CloseTag', name })
        );
      case 'JSXAttribute':
        return () => cont({
          type: 'UAST_Attr',
          name: node.name.name,
          value: node.value ? trampoline(() => _transform(node.value, res => res)) : null
        });
      case 'JSXText':
        return () => cont({ type: 'UAST_Text', value: node.value });
      case 'JSXFragment':
        // Produce a fragment UAST node
        return () => _transformArray(node.children, children =>
          cont({ type: 'UAST_Fragment', children })
        );
      case 'JSXExpressionContainer':
        return () => _transform(node.expression, expression =>
          cont({ type: 'UAST_Expr', expression })
        );
      case 'JSXSpreadAttribute':
        return () => _transform(node.argument, argument =>
          cont({ type: 'UAST_SpreadAttr', argument })
        );
      case 'JSXSpreadChild':
        return () => _transform(node.expression, expression =>
          cont({ type: 'UAST_SpreadChild', expression })
        );
      // If you use this as a helper marker, you can keep it as is
      case 'JSXBoundaryElement':
        return () => cont({ type: 'UAST_BoundaryElement', marker: '>' });
      // Variable declarations and declarators
      case 'VariableDeclaration':
        return () => _transformArray(node.declarations, declarations =>
          cont({ type: 'UAST_VarDecl', kind: node.kind, declarations })
        );
      case 'VariableDeclarator':
        return () => _transform(node.id, id =>
          _transform(node.init, init =>
            cont({ type: 'UAST_VarDeclarator', id, init: init || null })
          )
        );
      // Function types
      case 'ArrowFunctionExpression':
        return () => _transformArray(node.params, params =>
          _transform(node.body, body =>
            cont({ type: 'UAST_Func', async: node.async, params, body })
          )
        );
      case 'FunctionDeclaration':
        return () => _transform(node.id, id =>
          _transformArray(node.params, params =>
            _transform(node.body, body =>
              cont({ type: 'UAST_FuncDecl', id, async: node.async, params, body })
            )
          )
        );
      // Import/Export types
      case 'ImportDeclaration':
        return () => _transformArray(node.specifiers, specifiers =>
          _transform(node.source, source =>
            cont({ type: 'UAST_Import', specifiers, source })
          )
        );
      case 'ExportNamedDeclaration':
        return () => _transform(node.declaration, declaration =>
          _transformArray(node.specifiers, specifiers =>
            _transform(node.source, source =>
              cont({
                type: 'UAST_ExportNamed',
                declaration: declaration || null,
                specifiers,
                source: source || null
              })
            )
          )
        );
      case 'ExportDefaultDeclaration':
        return () => _transform(node.declaration, declaration =>
          cont({ type: 'UAST_ExportDefault', declaration })
        );
      // Return and call expressions
      case 'ReturnStatement':
        return () => _transform(node.argument, argument =>
          cont({ type: 'UAST_Return', argument })
        );
      case 'CallExpression': {
        const calleeName = node.callee && node.callee.name;
        const newType = (calleeName && ['useState', 'useEffect', 'useRef', 'useContext', 'useReducer']
          .includes(calleeName))
          ? `UAST_${capitalize(calleeName)}`
          : 'UAST_CallExpr';
        return () => _transform(node.callee, callee =>
          _transformArray(node.arguments, args =>
            cont({ type: newType, callee, arguments: args })
          )
        );
      }
      case 'MemberExpression':
        return () => _transform(node.object, object =>
          _transform(node.property, property =>
            cont({ type: 'UAST_MemberExpr', object, property })
          )
        );
      // Literal and identifier types
      case 'StringLiteral':
        return () => cont({ type: 'UAST_Literal', value: node.value });
      case 'NumericLiteral':
        return () => cont({ type: 'UAST_Literal', value: node.value });
      case 'BooleanLiteral':
        return () => cont({ type: 'UAST_Literal', value: node.value });
      case 'NullLiteral':
        return () => cont({ type: 'UAST_Literal', value: null });
      case 'JSXIdentifier':
        return () => cont({ type: 'UAST_Identifier', name: node.name });
      case 'JSXMemberExpression':
        return () => _transform(node.object, object =>
          _transform(node.property, property =>
            cont({ type: 'UAST_MemberExpr', object, property })
          )
        );
      case 'JSXNamespacedName':
        return () => _transform(node.namespace, namespace =>
          _transform(node.name, name =>
            cont({ type: 'UAST_NamespacedName', namespace, name })
          )
        );
      case 'JSXEmptyExpression':
        return () => cont({ type: 'UAST_EmptyExpr' });
      default:
        // Deeply clone and transform all properties of the node.
        return () => deepTransform(node, _transform, cont);
    }
  }

  function _transformArray(arr, cont) {
    function iter(i, acc) {
      if (i === arr.length) return cont(acc);
      return () => _transform(arr[i], res => iter(i + 1, [...acc, res]));
    }
    return iter(0, []);
  }

  return trampoline(() => _transform(node, res => res));
}

export default transformNodeTCO;
