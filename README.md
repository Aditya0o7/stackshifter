# React-to-Next.js Migration Pipeline

This project provides an automated pipeline to convert a standard React (Vite/CRA-style) project into a Next.js-compatible codebase. It handles the file restructuring, CSS Modules migration, import path correction, and more—making it easy to modernize your React app for Next.js.

---

## Features

- **Automatic File Restructuring:**  
  Moves and renames files to match Next.js conventions (`pages/`, `components/`, `styles/`, `public/`).

- **CSS Modules Migration:**  
  Converts global and component CSS files to CSS Modules, updates imports, and rewrites class names in JSX.

- **Import Path Correction:**  
  Fixes all import paths to match the new structure and Next.js best practices.

- **Routing Transformation:**  
  Converts React Router routes to Next.js pages, including catch-all and 404 routes.

- **Public Asset Copying:**  
  Moves static assets from the original `public/` folder to the Next.js `public/` directory.

- **Batch Processing:**  
  Handles large codebases efficiently and sequentially.

---

## How It Works

1. **Copy Public Assets:**  
   All files from the original `public/` are copied to `migration-output/public/`.

2. **Migrate Styles:**  
   All CSS files are converted to `.module.css` and moved to `migration-output/styles/`.  
   Class names in JSX are updated to use CSS Modules.

3. **Copy Source Files:**  
   All files from `src/pages/` and `src/components/` are copied to `migration-output/pages/` and `migration-output/components/` respectively.

4. **Normalize Pages:**  
   React Router routes are converted to Next.js pages, including catch-all (`[...slug].jsx`) and 404 pages.

5. **Fix Class Names:**  
   All class names in JSX are updated to use the CSS Modules pattern.

6. **JSX Codemods:**  
   Removes React Router code and rewrites links to use Next.js `<Link>`.

7. **Correct Import Paths:**  
   All import paths are updated to match the new structure.

---

## Usage

1. **Clone this repository and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd react-nextjs-migration
   npm install
   ```

2. **Place your React app in `sample-react-app/` with the following structure:**
   ```
   sample-react-app/
     public/
     src/
       components/
       pages/
       styles/
   ```

3. **Run the migration pipeline:**
   ```bash
   node React-Nextjs-Conversion.js
   ```

4. **Check the output in `migration-output/`.**
   - Copy the contents of `migration-output/` into your Next.js project.
   - If you use global styles, add `import '../styles/global.module.css';` to your Next.js `pages/_app.jsx`.

---

## Notes

- The pipeline does **not** generate a Next.js `_app.jsx` file.  
  If you use global styles, add the import manually to your own `_app.jsx`.
- All CSS is migrated to CSS Modules.  
  If you have global CSS, ensure it is imported in `_app.jsx`.
- The tool assumes a standard React project structure.  
  For custom setups, you may need to adjust the pipeline or your source files.

---

## Limitations

- Does not handle advanced Next.js features (API routes, dynamic imports, etc.).
- Assumes all CSS class names are unique within each file.
- Some manual review may be required for complex routing or edge cases.

---

## License

MIT

---

## Acknowledgements

- Inspired by real-world migration needs and the Next.js documentation.
- Uses [PostCSS](https://postcss.org/), [globby](https://github.com/sindresorhus/globby), and [jscodeshift](https://github.com/facebook/jscodeshift) for code transformation.

---

**Happy migrating!**
