import * as t from "@babel/types";
import pkg from '@babel/types';
const {
  identifier,
  jsxElement,
  jsxOpeningElement,
  jsxClosingElement,
  jsxText,
  jsxFragment,
  jsxOpeningFragment,
  jsxClosingFragment,
  jsxSpreadAttribute,
  jsxSpreadChild,
  variableDeclaration,
  variableDeclarator,
  arrowFunctionExpression,
  functionDeclaration,
  importDeclaration,
  exportNamedDeclaration,
  exportDefaultDeclaration,
  returnStatement,
  callExpression,
  memberExpression,
  stringLiteral,
  numericLiteral,
  booleanLiteral,
  nullLiteral,
  tsTypeAnnotation,
  tsStringKeyword,
  tsNumberKeyword,
  tsBooleanKeyword,
  tsAnyKeyword,
  tsInterfaceDeclaration,
  tsInterfaceBody,
  tsPropertySignature,
  tsTypeAliasDeclaration,
  tsAsExpression,
  jsxIdentifier
} = pkg;

// Utility: Normalize lists that are objects with numeric keys to arrays.


function convertToJSXName(node) {
  if (!node || typeof node !== "object") return node;

  switch (node.type) {
    // plain <Foo>
    case "Identifier":
    case "UAST_Identifier":
      return t.jsxIdentifier(node.name);

    // member names, e.g. <React.Fragment> or <My.Namespace.Component>
    case "UAST_MemberExpr":
    case "MemberExpression":
      return t.jsxMemberExpression(
        convertToJSXName(node.object),
        convertToJSXName(node.property)
      );

    // namespaced, e.g. <svg:path> or <custom:widget>
    case "UAST_NamespacedName":
      return t.jsxNamespacedName(
        convertToJSXName(node.namespace),
        convertToJSXName(node.name)
      );

    default:
      throw new Error(`Unexpected JSX name node: ${node.type}`);
  }
}

function normalizeList(obj) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj);
    if (keys.length && keys.every(k => /^[0-9]+$/.test(k))) {
      return Object.values(obj);
    }
  }
  return obj;
}

// Utility: Convert a plain value to a literal node.
function convertLiteral(uastNode) {
  if (typeof uastNode.value === 'string') {
    return stringLiteral(uastNode.value);
  } else if (typeof uastNode.value === 'number') {
    return numericLiteral(uastNode.value);
  } else if (typeof uastNode.value === 'boolean') {
    return booleanLiteral(uastNode.value);
  } else if (uastNode.value === null) {
    return nullLiteral();
  }
  // Fallback as string literal.
  return stringLiteral(String(uastNode.value));
}

// Utility: Convert UAST type annotations to TS type keywords.
function convertUASTType(uastTypeNode) {
  switch (uastTypeNode.typeName) {
    case "string":
      return tsStringKeyword();
    case "number":
      return tsNumberKeyword();
    case "boolean":
      return tsBooleanKeyword();
    default:
      return tsAnyKeyword();
  }
}

// Utility: Convert UAST property signature (for interface props, etc.)
function convertUASTPropertySignature(uastProp) {
  return tsPropertySignature(
    convertUASTToTSX(uastProp.key),
    tsTypeAnnotation(convertUASTType(uastProp.typeAnnotation))
  );
}

// Main conversion function:
// Recursively converts UAST nodes to Babel TSX AST nodes.
function convertUASTToTSX(uastNode) {
  if (!uastNode || typeof uastNode !== "object") return uastNode;
  
  // If node is already an array, process each element.
  if (Array.isArray(uastNode)) {
    return uastNode.map(convertUASTToTSX);
  }

  // Normalize common properties.
  if (uastNode.body) {
    uastNode.body = normalizeList(uastNode.body);
  }
  if (uastNode.declarations) {
    uastNode.declarations = normalizeList(uastNode.declarations);
  }
  if (uastNode.params) {
    uastNode.params = Array.isArray(uastNode.params) ? uastNode.params : [];
  }
  if (uastNode.attributes) {
    uastNode.attributes = Array.isArray(uastNode.attributes) ? uastNode.attributes : [];
  }
  if (uastNode.children) {
    uastNode.children = Array.isArray(uastNode.children) ? uastNode.children : [];
  }

  switch (uastNode.type) {
    // --- JSX Elements ---
    case "UAST_Element": {
      const opening = convertUASTToTSX(uastNode.opening);
      const children = uastNode.children.map(convertUASTToTSX);
      const closing = uastNode.closing ? convertUASTToTSX(uastNode.closing) : null;
      return jsxElement(opening, closing, children, false);
    }
    case "UAST_OpenTag": {
      // Replaces the old name handling logic
      const tagName = convertToJSXName(uastNode.name);
    
      const attributes = uastNode.attributes.map(convertUASTToTSX);
      const selfClosing = !!uastNode.selfClosing;
    
      return jsxOpeningElement(tagName, attributes, selfClosing);
    }
    
    case "UAST_CloseTag": {
      // Again, use our JSX name builder for consistency
      const tagName = convertToJSXName(uastNode.name);
      return jsxClosingElement(tagName);
    }
    
    // --- JSX Fragments ---
    case "UAST_Fragment": {
      const children = uastNode.children.map(convertUASTToTSX);
      return jsxFragment(jsxOpeningFragment(), jsxClosingFragment(), children);
    }
    // --- JSX Spread Attributes/Children ---
    case "UAST_SpreadAttr": {
      const argument = convertUASTToTSX(uastNode.argument);
      return jsxSpreadAttribute(argument);
    }
    case "UAST_SpreadChild": {
      const expression = convertUASTToTSX(uastNode.expression);
      return jsxSpreadChild(expression);
    }
    // --- JSX Text ---
    case "UAST_Text": {
      return jsxText(uastNode.value);
    }
    // --- JSX Expression Container ---
    case "UAST_Expr": {
      return {
        type: "JSXExpressionContainer",
        expression: convertUASTToTSX(uastNode.expression)
      };
    }
    // --- JSX Attributes ---
    case "UAST_Attr": {
      const name = jsxIdentifier(uastNode.name);
      let value = null;
      if (uastNode.value !== undefined && uastNode.value !== null) {
        const conv = convertUASTToTSX(uastNode.value);
        if (conv.type && conv.type.startsWith("JSX")) {
          value = conv;
        } else {
          value = {
            type: "JSXExpressionContainer",
            expression: conv
          };
        }
      }
      return {
        type: "JSXAttribute",
        name,
        value
      };
    }
    // --- Variable Declarations & Declarators ---
    case "UAST_VarDecl": {
      const declarations = normalizeList(uastNode.declarations).map(convertUASTToTSX);
      return variableDeclaration(uastNode.kind, declarations);
    }
    case "UAST_VarDeclarator": {
      const id = convertUASTToTSX(uastNode.id);
      const init = uastNode.init ? convertUASTToTSX(uastNode.init) : null;
      return variableDeclarator(id, init);
    }
    // --- Functions ---
    case "UAST_Func": {
      const params = Array.isArray(uastNode.params) ? uastNode.params.map(convertUASTToTSX) : [];
      const body = convertUASTToTSX(uastNode.body);
      return arrowFunctionExpression(params, body, uastNode.async || false);
    }
    case "UAST_FuncDecl": {
      const id = convertUASTToTSX(uastNode.id);
      const params = Array.isArray(uastNode.params) ? uastNode.params.map(convertUASTToTSX) : [];
      const body = convertUASTToTSX(uastNode.body);
      return functionDeclaration(id, params, body, uastNode.async || false);
    }
    // --- Import / Export ---
    case "UAST_Import": {
      const specifiers = Array.isArray(uastNode.specifiers)
        ? uastNode.specifiers.map(convertUASTToTSX)
        : [];
      const source = convertUASTToTSX(uastNode.source);
      return importDeclaration(specifiers, source);
    }
    case "UAST_ExportNamed": {
      const declaration = uastNode.declaration ? convertUASTToTSX(uastNode.declaration) : null;
      const specifiers = Array.isArray(uastNode.specifiers)
        ? uastNode.specifiers.map(convertUASTToTSX)
        : [];
      const source = uastNode.source ? convertUASTToTSX(uastNode.source) : null;
      return exportNamedDeclaration(declaration, specifiers, source);
    }
    case "UAST_ExportDefault": {
      const declaration = convertUASTToTSX(uastNode.declaration);
      return exportDefaultDeclaration(declaration);
    }
    // --- Return Statement ---
    case "UAST_Return": {
      const argument = uastNode.argument ? convertUASTToTSX(uastNode.argument) : null;
      return returnStatement(argument);
    }
    // --- Call Expressions ---
    case "UAST_CallExpr": {
      const callee = convertUASTToTSX(uastNode.callee);
      const args = Array.isArray(uastNode.arguments)
        ? uastNode.arguments.map(convertUASTToTSX)
        : [];
      return callExpression(callee, args);
    }
    // --- Specialized hook calls (e.g. useState, useEffect, etc.) ---
    case "UAST_UseState":
    case "UAST_UseEffect":
    case "UAST_UseRef":
    case "UAST_UseContext":
    case "UAST_UseReducer": {
      const callee = convertUASTToTSX(uastNode.callee);
      const args = Array.isArray(uastNode.arguments)
        ? uastNode.arguments.map(convertUASTToTSX)
        : [];
      return callExpression(callee, args);
    }
    // --- Member Expressions ---
    case "UAST_MemberExpr": {
      const object = convertUASTToTSX(uastNode.object);
      const propertyNode = convertUASTToTSX(uastNode.property);
      // If the property is not a simple Identifier or PrivateName, mark computed as true.
      const computed = !(propertyNode.type === "Identifier" || propertyNode.type === "PrivateName");
      return memberExpression(object, propertyNode, computed);
    }
    // --- Literals ---
    case "UAST_Literal": {
      return convertLiteral(uastNode);
    }
    // --- Identifiers ---
    case "UAST_Identifier": {
      const id = identifier(uastNode.name);
      if (uastNode.typeAnnotation) {
        id.typeAnnotation = tsTypeAnnotation(convertUASTType(uastNode.typeAnnotation));
      }
      return id;
    }
    // --- Namespaced Name ---
    case "UAST_NamespacedName": {
      const namespace = convertUASTToTSX(uastNode.namespace);
      const name = convertUASTToTSX(uastNode.name);
      return {
        type: "JSXNamespacedName",
        namespace,
        name
      };
    }
    // --- Empty Expression ---
    case "UAST_EmptyExpr": {
      return { type: "JSXEmptyExpression" };
    }
    // --- TypeScript Type Alias ---
    case "UAST_TsTypeAlias": {
      const id = convertUASTToTSX(uastNode.id);
      const right = convertUASTToTSX(uastNode.typeAnnotation);
      return tsTypeAliasDeclaration(id, right);
    }
    // --- TypeScript "as" Expression ---
    case "UAST_TsAsExpr": {
      const expression = convertUASTToTSX(uastNode.expression);
      const typeAnnotation = tsTypeAnnotation(convertUASTType(uastNode.typeAnnotation));
      return tsAsExpression(expression, typeAnnotation);
    }
    // --- TypeScript Interface ---
    case "UAST_TsInterface": {
      const id = convertUASTToTSX(uastNode.id);
      const body = tsInterfaceBody(
        Array.isArray(uastNode.body)
          ? uastNode.body.map(convertUASTPropertySignature)
          : []
      );
      return tsInterfaceDeclaration(id, body);
    }
    // --- Fallback: Deeply convert other properties ---
    default: {
      const result = {};
      for (const key in uastNode) {
        result[key] = convertUASTToTSX(uastNode[key]);
      }
      return result;
    }
  }
}

export default convertUASTToTSX;
