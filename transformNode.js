// Utility
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

function transformNode(node) {
    if (!node || typeof node !== 'object') return node;

    const queue = [node];
    const seen = new WeakSet();

    function handleSingleNode(current) {
        if (!current || typeof current !== 'object' || seen.has(current)) return current;
        seen.add(current);

        switch (current.type) {
            // JSX Core
            case 'JSXOpeningElement':
                return {
                    type: 'UAST_OpenTag',
                    name: transformNode(current.name),
                    attributes: current.attributes.map(transformNode)
                };

            case 'JSXClosingElement':
                return {
                    type: 'UAST_CloseTag',
                    name: transformNode(current.name)
                };

            case 'JSXAttribute':
                return {
                    type: 'UAST_Attr',
                    name: current.name.name,
                    value: current.value ? transformNode(current.value) : null
                };

            case 'JSXText':
                return {
                    type: 'UAST_Text',
                    value: current.value
                };

            case 'JSXFragment':
                return {
                    type: 'UAST_Fragment',
                    children: current.children.map(transformNode)
                };

            // Expressions
            case 'JSXExpressionContainer':
                return {
                    type: 'UAST_Expr',
                    expression: transformNode(current.expression)
                };

            case 'JSXSpreadAttribute':
                return {
                    type: 'UAST_SpreadAttr',
                    argument: transformNode(current.argument)
                };

            case 'JSXSpreadChild':
                return {
                    type: 'UAST_SpreadChild',
                    expression: transformNode(current.expression)
                };

            // JS inside JSX
            case 'VariableDeclaration':
                return {
                    type: 'UAST_VarDecl',
                    kind: current.kind,
                    declarations: current.declarations.map(transformNode)
                };

            case 'ArrowFunctionExpression':
                return {
                    type: 'UAST_Func',
                    async: current.async,
                    params: current.params.map(transformNode),
                    body: transformNode(current.body)
                };

            case 'FunctionDeclaration':
                return {
                    type: 'UAST_FuncDecl',
                    id: current.id ? transformNode(current.id) : null,
                    async: current.async,
                    params: current.params.map(transformNode),
                    body: transformNode(current.body)
                };

            case 'ImportDeclaration':
                return {
                    type: 'UAST_Import',
                    specifiers: current.specifiers.map(transformNode),
                    source: transformNode(current.source)
                };

            case 'ExportNamedDeclaration':
                return {
                    type: 'UAST_ExportNamed',
                    declaration: current.declaration ? transformNode(current.declaration) : null,
                    specifiers: current.specifiers.map(transformNode),
                    source: current.source ? transformNode(current.source) : null
                };

            case 'ExportDefaultDeclaration':
                return {
                    type: 'UAST_ExportDefault',
                    declaration: transformNode(current.declaration)
                };

            case 'ReturnStatement':
                return {
                    type: 'UAST_Return',
                    argument: transformNode(current.argument)
                };

            case 'CallExpression': {
                const calleeName = current.callee?.name;
                const reactHooks = ['useState', 'useEffect', 'useRef', 'useContext', 'useReducer'];
                const newType = reactHooks.includes(calleeName) ? `UAST_${capitalize(calleeName)}` : 'UAST_CallExpr';

                return {
                    type: newType,
                    callee: transformNode(current.callee),
                    arguments: current.arguments.map(transformNode)
                };
            }

            case 'MemberExpression':
                return {
                    type: 'UAST_MemberExpr',
                    object: transformNode(current.object),
                    property: transformNode(current.property)
                };

            // Literals
            case 'StringLiteral':
                return {
                    type: 'UAST_Literal',
                    value: current.value
                };

            case 'NumericLiteral':
                return {
                    type: 'UAST_Literal',
                    value: current.value
                };

            case 'BooleanLiteral':
                return {
                    type: 'UAST_Literal',
                    value: current.value
                };

            case 'NullLiteral':
                return {
                    type: 'UAST_Literal',
                    value: null
                };

            // JSX Identifiers
            case 'JSXIdentifier':
                return {
                    type: 'UAST_Identifier',
                    name: current.name
                };

            case 'JSXMemberExpression':
                return {
                    type: 'UAST_MemberExpr',
                    object: transformNode(current.object),
                    property: transformNode(current.property)
                };

            case 'JSXNamespacedName':
                return {
                    type: 'UAST_NamespacedName',
                    namespace: transformNode(current.namespace),
                    name: transformNode(current.name)
                };

            case 'JSXEmptyExpression':
                return {
                    type: 'UAST_EmptyExpr'
                };

            default:
                return current; // fallback
        }
    }

    return handleSingleNode(node);
}

export default transformNode;