#!/usr/bin/env node
import path from 'path';
import { Command } from 'commander';
import runReactToNextPipeline from '../commands/react-nextjs/React-Nextjs-Conversion.js';
import runJsxToTsxConversion from '../commands/jsx-tsx/jsx-tsx-conversion.js'; // Adjust path accordingly

const program = new Command();

program
  .name('stackshifter')
  .description('CLI tool to shift your stack effortlessly 😎')
  .version('1.0.1');

program
  .command('shiftto')
  .description('Shift tech stack')
  .argument('<target>', 'What to shift to (nextjs | jsx | jsx-tsx)')
  .option('-i, --input <path>', 'Source directory (nextjs) or JSX file (jsx-tsx)')
  .action(async (target, options) => {
    if (target === 'nextjs') {
      // Input optional, default to cwd
      const inputDir = path.resolve(options.input || process.cwd());
      console.log(`🚀 Migrating React app from: ${inputDir}`);
      await runReactToNextPipeline(inputDir);

    } else if (target === 'tsx') {
      if (!options.input) {
        console.error('❌ You must provide a JSX file path with -i <file.jsx>');
        process.exit(1);
      }
      const inputFile = path.resolve(options.input);
      if (!inputFile.endsWith('.jsx')) {
        console.error('❌ Input file must have a .jsx extension');
        process.exit(1);
      }
      console.log(`🚀 Converting JSX file: ${inputFile} to TSX`);
      await runJsxToTsxConversion(inputFile);

    } else {
      console.error('❌ Unknown target. Use "nextjs", or "tsx"');
      process.exit(1);
    }
  });

program.parse();
