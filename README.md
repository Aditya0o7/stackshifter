# StackShifter.
A powerful CLI tool to effortlessly migrate your React applications to Next.js with automatic file restructuring, CSS Modules conversion, and routing transformation.

## Features

- **Automatic File Restructuring**: Converts React project structure to Next.js 13+ App Directory
- **CSS Modules Migration**: Automatically converts CSS to CSS Modules with updated imports
- **Smart Routing**: Transforms React Router routes to Next.js pages with nested route support
- **Component Organization**: Preserves component hierarchy and relationships
- **Import Path Correction**: Fixes all import paths to match Next.js structure
- **"use client" Directives**: Automatically adds client directives for interactive components
- **Public Asset Migration**: Copies and organizes static assets
- **Two Migration Modes**: Manual (`shiftto`) or automatic (`migrate`) workflows

---

## 🚀 Quick Start

### Installation

#### Option 1: Clone from GitHub (Development)
```bash
git clone https://github.com/yourusername/stackshifter.git
cd stackshifter
npm install
npm link  # Makes stackshifter command available globally
```

#### Option 2: Install from npm (Coming Soon)
```bash
npm install -g stackshifter
```

---

## Usage

StackShifter provides two powerful commands for different migration workflows:

### 1. `shiftto` - Manual Migration
Creates a `migration-output` folder that you manually copy to your Next.js project.

#### Migrate React to Next.js (Pages Directory)
```bash
stackshifter shiftto nextjs -i ./my-react-app
```

#### Convert JSX to TSX
```bash
stackshifter shiftto tsx -i ./component.jsx
```

### 2. `migrate` - Automatic Migration
Creates a complete Next.js 13+ app with your migrated code automatically integrated.

```bash
stackshifter migrate -s ./my-react-app -t ./output-directory -n my-nextjs-app
```

**Options:**
- `-s, --source <path>`: React app source directory (default: current directory)
- `-t, --target <path>`: Directory where Next.js app will be created (required)
- `-n, --name <name>`: Name of the Next.js app (required)
- `--no-start`: Don't automatically start the development server

---

## How It Works

### Migration Pipeline (8 Steps)

1. **Copy Public Assets**  
   Migrates `public/` folder contents to maintain static assets

2. **Handle Styles**  
   Converts CSS files to CSS Modules (`.module.css`) with automatic class name updates

3. **Process Source Files**  
   Copies and processes `src/pages/` and `src/components/` with nested directory support

4. **Normalize Pages**  
   Converts React Router structure to Next.js pages with dynamic routes support

5. **Fix Class Names**  
   Updates JSX to use CSS Modules syntax (`className={styles.className}`)

6. **JSX Transformations**  
   - Removes React Router imports (`react-router-dom`)
   - Converts `<Link to="...">` to `<Link href="...">`
   - Removes `<BrowserRouter>`, `<Routes>`, `<Route>` wrappers
   - Adds Next.js `Link` imports

7. **Correct Import Paths**  
   Updates all import statements to match new file structure

8. **Add "use client" Directives**  
   Automatically detects and adds client directives for components using:
   - React hooks (`useState`, `useEffect`, etc.)
   - Event handlers (`onClick`, `onChange`, etc.)
   - Browser APIs (`window`, `localStorage`, etc.)

---

## Project Structure Requirements

### Input (React App)
```
my-react-app/
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   └── Footer/
│   │       └── Footer.jsx
│   ├── pages/
│   │   ├── index.jsx        # Homepage
│   │   ├── about.jsx        # About page
│   │   └── blog/
│   │       ├── index.jsx    # Blog homepage
│   │       └── [slug].jsx   # Dynamic blog post
│   ├── styles/
│   │   ├── globals.css
│   │   └── components.css
│   └── App.jsx
└── package.json
```

### Output (Next.js 13+ App)
```
my-nextjs-app/
├── public/              # ← Copied from React app
├── styles/              # ← CSS Modules (.module.css)
├── src/
│   ├── app/             # ← Next.js 13+ App Directory
│   │   ├── page.js      # ← From pages/index.jsx
│   │   ├── layout.js    # ← Auto-generated
│   │   ├── about/
│   │   │   └── page.js  # ← From pages/about.jsx
│   │   └── blog/
│   │       ├── page.js  # ← From pages/blog/index.jsx
│   │       └── [slug]/
│   │           └── page.js  # ← From pages/blog/[slug].jsx
│   └── components/      # ← Processed components with CSS Modules
└── package.json
```

---

## Advanced Features

### Nested Pages Support
StackShifter automatically handles complex nested page structures:

```javascript
// Input: src/pages/dashboard/analytics/reports.jsx
// Output: src/app/dashboard/analytics/reports/page.js
```

### Dynamic Routes
Supports all Next.js dynamic routing patterns:

- `[id].jsx` → `[id]/page.js` (Single dynamic segment)
- `[...slug].jsx` → `[...slug]/page.js` (Catch-all routes)
- `[[...slug]].jsx` → `[[...slug]]/page.js` (Optional catch-all)

### CSS Modules Integration
Automatically converts and updates CSS usage:

```jsx
// Before
import './Button.css';
<button className="primary-btn">Click me</button>

// After
import styles from '../../styles/Button.module.css';
<button className={styles.primaryBtn}>Click me</button>
```

---

## What's Included & Future Enhancements

StackShifter focuses on the core migration challenges that matter most - **file structure, routing, styling, and component compatibility**. Here's what we handle automatically and what you might need to fine-tune:

### **Fully Automated**
- Complete file restructuring and routing migration
- CSS Modules conversion with import updates
- Component hierarchy preservation
- "use client" directive placement
- Public asset organization

### **May Need Manual Review** (Usually Quick Fixes)
- **API Routes**: We migrate your frontend perfectly! For backend endpoints, simply create new files in `app/api/` - Next.js makes this super easy
- **Advanced Next.js 13+ Features**: Your migrated app works immediately. You can gradually adopt Server Components, Streaming, and other modern features at your own pace
- **Custom Build Config**: Standard Webpack configs usually aren't needed in Next.js - the framework handles most optimizations automatically
- **Complex State Management**: Libraries like Redux/Zustand typically work out-of-the-box, but you may want to optimize for Next.js patterns
- **Test Files**: Your existing tests often work with minimal changes - just update import paths if needed

### **Pro Tip**
Most "limitations" are actually **opportunities to modernize**! Next.js 13+ provides better alternatives to many custom configurations, and our migration gives you a solid foundation to build upon.

**Bottom Line**: StackShifter handles the heavy lifting (90% of migration work), leaving you with minor adjustments that are often improvements to your codebase!

---

## Examples

### Basic React App Migration
```bash
# Create migration output folder
stackshifter shiftto nextjs -i ./my-react-app

# Or create complete Next.js app
stackshifter migrate -s ./my-react-app -t ./projects -n awesome-nextjs-app
```

### Convert Single JSX to TSX
```bash
stackshifter shiftto tsx -i ./components/Button.jsx
# Creates: ./components/Button.tsx
```

### Complex Project with Nested Pages
```bash
stackshifter migrate \
  -s ./complex-react-app \
  -t ./output \
  -n migrated-app \
  --no-start
```

---

## Testing Your Migration

After migration, verify these key areas:

1. **Routing**: Test all page navigation
2. **Styling**: Verify CSS Modules are working
3. **Components**: Check interactive features work
4. **Images/Assets**: Confirm static assets load correctly
5. **Console**: Check for any client/server component errors

---

### Development Setup
```bash
git clone https://github.com/Aditya0o7/stackshifter.git
cd stackshifter
npm install
npm link
```

### Running Tests
```bash
npm test
```

---

Built with ❤️ using:
- [jscodeshift](https://github.com/facebook/jscodeshift) for code transformations
- [globby](https://github.com/sindresorhus/globby) for file pattern matching
- [fs-extra](https://github.com/jprichardson/node-fs-extra) for file operations

---

**Happy migrating!**