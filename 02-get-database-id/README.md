# Get Notion Database ID

This script retrieves the Notion database ID from a search query, and prints the results to the console.

## Installation

Install the dependencies:

    npm install

Create an integration and connection to your database. Copy the secret token to `.env`. An example `.env` file is provided.

    cp .env.example .env

## Usage

The script takes a single argument, the database name. It will print the database ID to the console.

    node index.js "My Database"

The output will look something like this:

    [My Database] xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx
    [My Other Database] xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx
