const fs = require("fs");
const path = require("path");
const hljs = require("highlight.js/lib/common");

const outputFile = path.join(
  __dirname,
  "../03-export-page-data/notion-export.json"
);

if (!fs.existsSync(outputFile)) {
  console.error(`File not found: ${outputFile}`);
  process.exit(1);
}

const pages = JSON.parse(fs.readFileSync(outputFile));

function resolveTabs(tabsBlocks) {
  return tabsBlocks
    .map((tab) => {
      if (tab.type !== "callout") return null;
      return {
        label: tab.callout.rich_text
          .map(({ plain_text }) => plain_text)
          .join(""),
        text: tab.children[0].paragraph.rich_text
          .map(({ plain_text }) => plain_text)
          .join(""),
      };
    })
    .filter(Boolean);
}

const calloutMap = {
  tabs: (block) => {
    return {
      component: "Tabs",
      tabs: resolveTabs(block.children),
    };
  },
  code: (block) => {
    if (!block.children[0].code) {
      console.log("Code component must be first child of code callout");
      return null;
    }
    const code = block.children[0].code.rich_text
      .map(({ plain_text }) => plain_text)
      .join("");
    // YOU MAY NEED A MAPPER FOR THIS
    const language = block.children[0].code.language;
    const highlightedCode = hljs.highlight(code, { language }).value;
    return {
      component: "CodeBlock",
      filename: block.callout.rich_text
        .map(({ plain_text }) => plain_text)
        .join(""),
      code: highlightedCode,
      language: block.children[0].code.language,
    };
  },
};

function resolveCalloutComponent(block) {
  if (block.callout?.icon?.type !== "external") {
    console.log("ICON NOT SUPPORTED:", block.callout.icon);
    return null;
  }
  const iconName = block.callout.icon.external.url
    .split("/")
    .pop()
    .split(".")[0]
    .split("_")[0];
  if (!calloutMap[iconName]) {
    console.log("EXTERNAL ICON NOT SUPPORTED:", iconName);
    return null;
  }
  return calloutMap[iconName](block);
}

const blockMap = {
  callout: (block) => {
    const result = resolveCalloutComponent(block);
    if (!result) return null;
    return result;
  },
  paragraph: (block) => {
    if (block.paragraph.rich_text.length === 0) return null;
    return {
      component: "Paragraph",
      text: block.paragraph.rich_text
        .map(({ plain_text }) => plain_text)
        .join(""),
    };
  },
};

function transformBlocks(blocks) {
  return blocks
    .map((block) => {
      if (blockMap[block.type]) {
        return blockMap[block.type](block);
      }
      console.log("NOT SUPPORTED:", block.type);
    })
    .filter(Boolean);
}

let output = pages.map((page) => {
  const { properties, children, id } = page;
  return {
    id,
    title: properties.Name.title[0].text.content,
    urlPath: properties.Slug.rich_text[0].plain_text,
    blocks: transformBlocks(children),
  };
});

const transformedOutput = path.join(__dirname, "content.json");
fs.writeFileSync(transformedOutput, JSON.stringify(output, null, 2));
console.log(`Transformed ${output.length} pages to ${transformedOutput}`);
