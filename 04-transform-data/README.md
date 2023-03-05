# Transform Notion Page Data

This script expects a JSON export file in `../03-export-page-data/notion-export.json`. It reads this file and transforms it into `content.json`, which can be consumed by any site framework to generate components and pages.

## Installation

Install the dependencies:

    npm install

## Usage

Run the script:

    node index.js

The script will output `content.json` in this directory.
