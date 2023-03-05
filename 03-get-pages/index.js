#!/usr/bin/env node

const { Client } = require("@notionhq/client");

// Sensitive data is stored in .env file
require("dotenv").config();

// Exit if no query is provided
const query = process.argv[2];
if (!query) {
  console.log("Please provide a query");
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function getDatabaseId() {
  const response = await notion.search({
    query,
    filter: { property: "object", value: "database" },
  });
  response.results.map((result) =>
    console.log(`${result.title[0].plain_text} -> ${result.id}`)
  );
}

getDatabaseId();
