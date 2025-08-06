#!/usr/bin/env node
import path from 'path';
import { Command } from 'commander';
import runReactToNextPipeline from '../commands/react-nextjs/React-Nextjs-Conversion.js';
import runJsxToTsxConversion from '../commands/jsx-tsx/jsx-tsx-conversion.js';
import createNextJsApp from '../commands/react-nextjs/createNextJsApp.js'; // NEW IMPORT

const program = new Command();

program
  .name('stackshifter')
  .description('CLI tool to shift your stack effortlessly')
  .version('1.0.1');

// Existing command - keep exactly the same for backwards compatibility
program
  .command('shiftto')
  .description('Shift tech stack')
  .argument('<target>', 'What to shift to (nextjs | tsx)')
  .option('-i, --input <path>', 'Source directory (nextjs) or JSX file (tsx)')
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
      console.error('❌ Unknown target. Use "nextjs" or "tsx"');
      process.exit(1);
    }
  });

// Enhanced command for React to Next.js with automatic app creation
program
  .command('migrate')
  .description('Migrate React app to Next.js with automatic Next.js app creation')
  .option('-s, --source <path>', 'React app source directory', process.cwd())
  .requiredOption('-t, --target <path>', 'Directory where Next.js app will be created')
  .requiredOption('-n, --name <name>', 'Name of the Next.js app')
  .option('--no-start', 'Do not automatically start the development server')
  .action(async (options) => {
    const sourceDir = path.resolve(options.source);
    const targetDir = path.resolve(options.target);
    const appName = options.name;
    
    // Validate app name
    if (!/^[a-z0-9-_]+$/i.test(appName)) {
      console.error('❌ App name can only contain letters, numbers, hyphens, and underscores');
      process.exit(1);
    }
    
    console.log(`🚀 Migrating React app from: ${sourceDir}`);
    console.log(`📁 Creating Next.js app at: ${targetDir}/${appName}`);
    
    // Set environment variable for auto-start preference
    if (!options.start) {
      process.env.AUTO_START = 'false';
    }
    
    // Run the enhanced migration
    await createNextJsApp(sourceDir, targetDir, appName);
  });

program.parse();

// Visual CLI message at the end
const box = `
╔════════════════════════════════════════════════════════════╗
║        🚀  Thank you for using StackShifter CLI! 🚀       ║
║                                                            ║
║  Commands:                                                 ║
║  • stackshifter shiftto nextjs [-i <source>]               ║
║  • stackshifter shiftto tsx -i <file.jsx>                  ║
║  • stackshifter migrate -s <source> -t <target> -n <name>  ║
║                                                            ║
║  Options for migrate:                                      ║
║  • --no-start    Don't auto-start dev server              ║
║                                                            ║
║  For help & usage, visit:                                  ║
║  https://your-docs-link-here.com                           ║
║                                                            ║
║  Happy coding!                                             ║
╚════════════════════════════════════════════════════════════╝
`;
console.log(box);