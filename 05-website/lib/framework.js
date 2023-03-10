#!/usr/env/bin node

import ejs from 'ejs';
import fs from 'fs';
import glob from 'fast-glob';
import liveServer from 'live-server';
import path from 'path';
import prettier from 'prettier';

/* ----- Constants ----- */

const IS_DEV = process.argv.includes('dev');
const SRC_DIR = path.join(process.cwd(), 'src');
const DIST_DIR = path.join(process.cwd(), 'dist');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const LAYOUT_FILE = path.join(SRC_DIR, '_layout.ejs');

/* ----- References ----- */

// Shared across multiple functions and are populated by update functions.
let layout;
let components = {};

/* ----- Setup ----- */

// Remove existing dist directory and built files
if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
// Create new dist directory
fs.mkdirSync(DIST_DIR);

/* ----- Updaters ----- */

/**
 * Function to call when a file changes while development server is running.
 * Determines what to do based on the file that changed.
 *
 * @param {string} fileChanged - Path to file that changed
 * @param {string} watchDir - Absolute path to directory being watched
 */
function updateSite(fileChanged, watchDir) {
    console.log(`[Source Change] ${path.relative(process.cwd(), path.join(watchDir, fileChanged))}`);
    // If template file is changed, rebuild the entire site
    if (fileChanged.endsWith('.ejs')) return buildSite();
    // Otherwise, just rebuild the page that changed
    buildPage(fileChanged);
}

/**
 * Read layout and update `layout` reference. Called on initial build and
 * whenever a source file changes.
 */
function updateLayout() {
    layout = fs.readFileSync(LAYOUT_FILE, 'utf-8').toString();
}

/**
 * Update `components` reference. Called on initial build and whenever a
 * components file is changed.
 */
function updateComponentsRef() {
    const componentFiles = glob.sync('**/*.ejs', { cwd: COMPONENTS_DIR });
    components = Object.fromEntries(
        componentFiles.map((filePath) => {
            const componentName = path.basename(filePath, '.ejs');
            const component = fs.readFileSync(path.join(COMPONENTS_DIR, filePath), 'utf-8').toString();
            return [componentName, component];
        })
    );
}

/* ----- Renderers----- */

/**
 * Render a component with the given props.
 *
 * @param {Object} props Object of props to pass to component
 * @param {string} props.type Name of component to render
 * @returns
 */
function renderComponent(props) {
    return ejs.render(components[props.type], { ...props });
}

/* ----- Builders ----- */

/**
 * Retrieve all page files and build each page. Called on initial build and
 * whenever a source file is changed.
 */
function buildSite() {
    // Rebuild global references
    updateLayout();
    updateComponentsRef();
    // Get page files
    const pageFiles = glob.sync('**/*.json', { cwd: PAGES_DIR });
    // Build each page
    pageFiles.forEach(buildPage);
    // Provide feedback
    console.log(`Built ${pageFiles.length} pages`);
}

/**
 * Reads page content, runs it through the layout, and writes the result to a
 * file in the dist directory.
 *
 * @param {string} relSrcFilePath - Path to page file, relative to PAGES_DIR
 */
function buildPage(relSrcFilePath) {
    const absSrcFilePath = path.join(PAGES_DIR, relSrcFilePath);
    // Get and set urlPath on page from file path
    const urlPath = relSrcFilePath
        .replace(/\.json$/, '/index.html')
        .replace(/\/index\/index\.html$/, '/index.html')
        .replace(/^index\/index\.html$/, 'index.html');
    // Determine destination file path
    const distFilePath = path.join(DIST_DIR, urlPath);
    // If the source file doesn't exist, first delete the file in the dist if it
    // exists, then return
    if (!fs.existsSync(absSrcFilePath)) {
        if (fs.existsSync(distFilePath)) fs.rmSync(distFilePath);
        return;
    }
    // Read and parse page
    const page = JSON.parse(fs.readFileSync(absSrcFilePath, 'utf-8').toString());
    // Add meta information for the page
    page._meta = {
        // `id` is path from root of project (for inline editing)
        id: path.relative(process.cwd(), absSrcFilePath)
    };
    // Create directory if it doesn't exist
    const dirPath = path.dirname(distFilePath);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    // Run page through EJS layout and write to file
    const html = ejs.render(layout, { page, component: renderComponent });
    fs.writeFileSync(distFilePath, prettier.format(html, { parser: 'html' }));
}

/* ----- Watchers / Callers ----- */

if (IS_DEV) {
    // Watch for changes to content source files and rebuild
    fs.watch(PAGES_DIR, { recursive: true }, (_, filename) => updateSite(filename, PAGES_DIR));
    // Watch for changes to component files and rebuild
    fs.watch(COMPONENTS_DIR, { recursive: true }, (_, filename) => updateSite(filename, COMPONENTS_DIR));
    // Start development server, which serves from and watches for changes in the
    // dist directory
    liveServer.start({
        port: 3000,
        root: path.relative(process.cwd(), DIST_DIR),
        open: false,
        host: 'localhost'
    });
}

// Do the initial build
buildSite();
