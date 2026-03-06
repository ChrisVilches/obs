const express = require("express");
const path = require("path");
const fs = require("fs");

function initApp() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  const ROOT_DIR = process.env.DATA_ROOT_DIR;
  if (!ROOT_DIR) {
    console.error("FATAL: DATA_ROOT_DIR environment variable is not set.");
    process.exit(1);
  }
  if (!fs.existsSync(ROOT_DIR)) {
    console.error(
      `FATAL: DATA_ROOT_DIR "${ROOT_DIR}" does not exist or is not accessible.`,
    );
    process.exit(1);
  }

  const BOOKMARKS_REL = process.env.BOOKMARKS_PATH;
  if (!BOOKMARKS_REL) {
    console.error("FATAL: BOOKMARKS_PATH environment variable is not set.");
    process.exit(1);
  }
  const BOOKMARKS_FILE = path.join(ROOT_DIR, BOOKMARKS_REL);

  app.use(express.json());

  return { app, ROOT_DIR, BOOKMARKS_FILE, PORT };
}

module.exports = initApp;
