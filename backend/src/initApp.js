const express = require("express");
const path = require("node:path");
const multer = require("multer");
const env = require("./env");

function initApp() {
  const app = express();

  const CONFIG_DIR = path.join(env.DATA_ROOT_DIR, env.CONFIG_PATH);
  const BOOKMARKS_FILE = path.join(CONFIG_DIR, "bookmarks.json");
  const APP_CONFIG_FILE = path.join(CONFIG_DIR, "app.json");

  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  return {
    app,
    ROOT_DIR: env.DATA_ROOT_DIR,
    CONFIG_DIR,
    BOOKMARKS_FILE,
    APP_CONFIG_FILE,
    PORT: env.PORT,
    upload,
  };
}

module.exports = initApp;
