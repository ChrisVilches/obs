const path = require("node:path");
const fs = require("node:fs");
const { emit } = require("../eventChannel");

const defaultConfig = { strictLineBreaks: false };

async function getAppConfig(configFile) {
  await fs.promises.mkdir(path.dirname(configFile), { recursive: true });

  try {
    const raw = await fs.promises.readFile(configFile, "utf-8");
    const trimmed = raw.trim();
    const parsed = trimmed ? JSON.parse(trimmed) : {};
    return { ...defaultConfig, ...parsed };
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.promises.writeFile(
        configFile,
        JSON.stringify({}, null, 2),
        "utf-8",
      );
      return { ...defaultConfig };
    }
    throw err;
  }
}

async function updateAppConfig(configFile, updates) {
  const current = await getAppConfig(configFile);
  const merged = { ...current, ...updates };
  await fs.promises.writeFile(
    configFile,
    JSON.stringify(merged, null, 2),
    "utf-8",
  );
  emit({
    type: "config_updated",
    timestamp: new Date().toISOString(),
  });
  return merged;
}

module.exports = { getAppConfig, updateAppConfig };
