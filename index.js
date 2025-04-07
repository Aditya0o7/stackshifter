import parser from "@babel/parser";
import _traverse from "@babel/traverse";
import fs from "fs";

const traverse = _traverse.default;
// Read a sample JSX file (we'll create this next)
const jsxCode = fs.readFileSync("./sample.jsx", "utf-8");

// Parse JSX into AST
const ast = parser.parse(jsxCode, {
  sourceType: "module",
  plugins: ["jsx"],
});

// Log AST
console.log(JSON.stringify(ast, null, 2));

// Traverse and log JSX elements
traverse(ast, {
  JSXElement(path) {
    console.log("Found JSX Element:", path.node.openingElement.name.name);
  },
});
