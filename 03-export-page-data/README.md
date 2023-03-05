# Export Notion Page Data

This uses the database ID retrieved from the `02-get-database-id` script to export all the data from a Notion database.

It first retrieves raw page data, and then loops through the pages to retrieve the block data for each page. This is a long-running task, because it requires several API calls for each page.

## Installation

Install the dependencies:

    npm install

Create an integration and connection to your database. Copy the secret token to `.env`. An example `.env` file is provided.

    cp .env.example .env

You'll also need a Notion database ID, which you can't get from the URL. You can use the script in `02-get-database-id` to get the ID.

## Usage

Run the script after setting the appropriate environment variables:

    node index.js

This will create a `notion-export.json` file in this directory.
