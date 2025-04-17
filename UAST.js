import parser from "@babel/parser";
import fs from "fs";
import transformNodeTCO from "./transformNodeIterative.js";
import normalizeJSX from "./normalizeJSX.js";
import  convertUASTToTSX  from "./UASTtoTsx.js";
import { parse } from "@babel/parser";
import { generate } from "@babel/generator";

// Read the JSX file
const jsxCode = fs.readFileSync("./sample.jsx", "utf-8");

// Parse the code using Babel
const ast = parser.parse(jsxCode, {
  sourceType: "module",
  plugins: ["jsx"],
});

// Normalize the Babel AST (this cleans up empty texts, fragments, etc.)
const normalizedAst = normalizeJSX(ast);
// fs.writeFileSync('normalized.json', JSON.stringify(ast, null, 2), 'utf-8');

// Convert the normalized Babel AST to a Universal AST (UAST)
const uast = transformNodeTCO(normalizedAst);

// fs.writeFileSync('output.json', JSON.stringify(uast, null, 2), 'utf-8');
// console.log(JSON.stringify(uast, null, 2));
// const testNode = {
//   "type": "UAST_Element",
//   "opening": {
//     "type": "UAST_OpenTag",
//     "name": {
//       "type": "UAST_Identifier",
//       "name": "header"
//     },
//     "attributes": []
//   },
//   "children": []
// };
const tsxAst = convertUASTToTSX(uast);
const output = generate(
  tsxAst,
);
// console.log("------------------------------------------------------------------------------")
// console.log(JSON.stringify(tsxAst, null, 2));
// fs.writeFileSync('output2.json', JSON.stringify(tsxAst, null, 2), 'utf-8');
// console.log("------------------------------------------------------------------------------")
// console.log(JSON.stringify(output, null, 2));

fs.writeFileSync('tsxCode.tsx', output.code, 'utf-8');
