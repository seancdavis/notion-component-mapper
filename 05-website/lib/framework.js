#!/usr/env/bin node

import ejs from "ejs";
import fs from "fs";
import glob from "fast-glob";
import path from "path";
import prettier from "prettier";

/* ----- Constants ----- */

const ROOT_DIR = process.cwd();
const BUILD_DIR = path.join(ROOT_DIR, "dist");
const COMPONENTS_DIR = path.join(ROOT_DIR, "components");
const CONTENT_FILE = path.join(ROOT_DIR, "../04-transform-data/content.json");
const LAYOUT_FILE = path.join(ROOT_DIR, "_layout.ejs");

/* ----- Helpers ----- */

/**
 * Read files in the components directory and return an object with the name of
 * the component as the key and the component's content as the value.
 */
function getComponents() {
  const componentFiles = glob.sync("**/*.ejs", { cwd: COMPONENTS_DIR });
  return Object.fromEntries(
    componentFiles.map((filePath) => {
      const componentName = path.basename(filePath, ".ejs");
      const component = fs
        .readFileSync(path.join(COMPONENTS_DIR, filePath), "utf-8")
        .toString();
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
  if (!components[props.component]) {
    console.log(`[ERROR] Component ${props.component} not found`);
    return "";
  }
  return ejs.render(components[props.component], { ...props });
}

/**
 * Builds page in the build directory for the given page object.
 *
 * @param {Object} page - Page object
 * @param {string} page.urlPath - Path to page
 * @param {string} page.title - Title of page
 * @param {string} page.blocks - Transformed block content from Notion
 */
function buildPage(page) {
  const urlPath = page.urlPath.replace(/\/$/, "") + "/index.html";
  // Determine destination file path
  const buildFilePath = path.join(BUILD_DIR, urlPath);
  // Create directory if it doesn't exist
  const buildPath = path.dirname(buildFilePath);
  if (!fs.existsSync(buildPath)) fs.mkdirSync(buildPath, { recursive: true });
  // Run page through EJS layout and write to file
  const html = ejs.render(layout, { page, component: renderComponent });
  fs.writeFileSync(buildFilePath, prettier.format(html, { parser: "html" }));
}

/* ----- Runner ----- */

// Make sure content file exists
if (!fs.existsSync(CONTENT_FILE)) {
  console.error("Content file not found. Run build in Part 4 project first.");
}

// Remove existing dist directory and built files
if (fs.existsSync(BUILD_DIR)) {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}

// Create new dist directory
fs.mkdirSync(BUILD_DIR);

// Read site files
const pages = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf-8").toString());
const layout = fs.readFileSync(LAYOUT_FILE, "utf-8").toString();
const components = getComponents();

// Build each page
pages.map(buildPage);

// Provide feedback
console.log(`Built ${pages.length} pages`);
