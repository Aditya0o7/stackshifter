import * as babel from "@babel/core";
import _traverse from "@babel/traverse";
import parser from "@babel/parser";
import _generate from "@babel/generator";
import fs from "fs";
import * as t from "@babel/types";
import { variableDeclaration } from "@babel/types";
import { arrowFunctionExpression } from "@babel/types";

const generate = _generate.default;
const traverse = _traverse.default;
const jsxCode = fs.readFileSync("./sample.jsx", "utf-8");


const ast = parser.parse(jsxCode, {
  sourceType: "module",
  plugins: ["jsx"],
});

traverse(ast, {

  VariableDeclaration(path) {
    if(path.node.declarations[0]?.init?.callee?.name === "useState" || path.node.declarations[0]?.init?.callee?.name === "useRef"){
      console.log("Found useState/UseRef: Converting to UAST_State");

      path.replaceWith(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("UAST_State"),
            t.stringLiteral("useState/useRef representation") 
          )
        ])
      )
    }
    },
    ArrowFunctionExpression(path){
      if(path.parent.type === "VariableDeclarator"){
        console.log("Found arrowFunctionExpression: Converting to UAST_Function");
        path.parent.id.name = "UAST_Props";
      }
    }
})

const transformedCode = generate(ast, {}).code;
console.log("transformer UAST code: \n" ,transformedCode);


