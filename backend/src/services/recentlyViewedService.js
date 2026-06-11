const fs = require("node:fs");
const logger = require("../logger");

const VIEWS_FILE = "/tmp/obs-recently-viewed.json";
const MAX_ITEMS = 10;

async function getRecentlyViewed() {
  try {
    const raw = await fs.promises.readFile(VIEWS_FILE, "utf-8");
    const trimmed = raw.trim();
    if (!trimmed) return { recentlyViewed: [] };
    return JSON.parse(trimmed);
  } catch (err) {
    if (err.code === "ENOENT") {
      return { recentlyViewed: [] };
    }
    throw err;
  }
}

async function recordView(filePath) {
  try {
    let data;
    try {
      const raw = await fs.promises.readFile(VIEWS_FILE, "utf-8");
      data = JSON.parse(raw.trim() || '{"recentlyViewed":[]}');
    } catch {
      data = { recentlyViewed: [] };
    }

    data.recentlyViewed = data.recentlyViewed.filter(
      (item) => item.path !== filePath,
    );
    data.recentlyViewed.unshift({
      path: filePath,
      mtime: new Date().toISOString(),
    });
    data.recentlyViewed = data.recentlyViewed.slice(0, MAX_ITEMS);

    await fs.promises.writeFile(
      VIEWS_FILE,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  } catch (e) {
    logger.error("failed to record recently viewed file", {
      file: filePath,
      err: e,
    });
  }
}

module.exports = { getRecentlyViewed, recordView };
