import parser from "@babel/parser";
import fs from "fs";
import transformNodeTCO from "./transformNodeIterative.js";
import normalizeJSX from "./normalizeJSX.js";

// Read the JSX file
const jsxCode = fs.readFileSync("./sample.jsx", "utf-8");

// Parse the code using Babel
const ast = parser.parse(jsxCode, {
  sourceType: "module",
  plugins: ["jsx"],
});

// Normalize the Babel AST (this cleans up empty texts, fragments, etc.)
const normalizedAst = normalizeJSX(ast);

// Convert the normalized Babel AST to a Universal AST (UAST)
const uast = transformNodeTCO(normalizedAst);

console.log(JSON.stringify(uast, null, 2));
