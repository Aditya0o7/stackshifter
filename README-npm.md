# StackShifter

A powerful CLI tool to effortlessly migrate your React applications to Next.js with automatic file restructuring, CSS Modules conversion, and routing transformation.

## Features

- **Automatic File Restructuring** - React to Next.js 13+ App Directory
- **CSS Modules Migration** - Auto-converts CSS with updated imports  
- **Smart Routing** - React Router to Next.js pages with nested routes
- **"use client" Directives** - Auto-adds client directives for interactive components
- **Two Migration Modes** - Manual (`shiftto`) or automatic (`migrate`)

## Installation

```bash
npm install -g stackshifter
```

## Quick Usage

### Manual Migration (Creates migration-output folder)
```bash
stackshifter shiftto nextjs -i ./my-react-app
```
```bash
stackshifter shiftto tsx -i ./jsxcomp.jsx
```

### Automatic Migration (Creates complete Next.js app)
```bash
stackshifter migrate -s ./my-react-app -t ./output-dir -n my-nextjs-app
```

##  What Gets Migrated

File structure → Next.js 13+ App Directory  
CSS → CSS Modules with automatic imports  
React Router → Next.js routing  
Components with preserved hierarchy  
Public assets and static files  
Import paths automatically corrected  

## Example Migration

**Input (React):**
```
src/pages/index.jsx     → src/app/page.js
src/pages/about.jsx     → src/app/about/page.js  
src/pages/blog/[id].jsx → src/app/blog/[id]/page.js
```

**Commands:**
- `-s, --source` - React app directory
- `-t, --target` - Output directory  
- `-n, --name` - Next.js app name
- `--no-start` - Skip dev server

## Migration Pipeline

1. Copy public assets
2. Convert CSS to CSS Modules
3. Process pages and components  
4. Transform React Router → Next.js
5. Fix class names and imports
6. Add "use client" directives
7. Generate Next.js 13+ structure

## Full Documentation

- [Full Documentation](https://github.com/Aditya0o7/stackshifter)
---

**Happy migrating!**