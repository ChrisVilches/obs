const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const logger = require("./logger");

function initApp() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  const ROOT_DIR = process.env.DATA_ROOT_DIR;
  if (!ROOT_DIR) {
    logger.error("DATA_ROOT_DIR environment variable is not set.");
    process.exit(1);
  }
  if (!fs.existsSync(ROOT_DIR)) {
    logger.error("DATA_ROOT_DIR does not exist or is not accessible.", { dir: ROOT_DIR });
    process.exit(1);
  }

  const CONFIG_REL = process.env.CONFIG_PATH;
  if (!CONFIG_REL) {
    logger.error("CONFIG_PATH environment variable is not set.");
    process.exit(1);
  }
  const CONFIG_DIR = path.join(ROOT_DIR, CONFIG_REL);
  const BOOKMARKS_FILE = path.join(CONFIG_DIR, "bookmarks.json");
  const APP_CONFIG_FILE = path.join(CONFIG_DIR, "app.json");

  app.use(express.json());

  return { app, ROOT_DIR, CONFIG_DIR, BOOKMARKS_FILE, APP_CONFIG_FILE, PORT };
}

module.exports = initApp;
