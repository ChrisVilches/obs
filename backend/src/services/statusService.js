const { execSync } = require("node:child_process");
const { getRecentEvents } = require("../eventChannel");
const env = require("../env");

function getStatus() {
  let rgOk = false,
    findOk = false;
  try {
    rgOk = execSync("rg --version", { encoding: "utf8" }).includes("ripgrep");
  } catch {}
  try {
    findOk = execSync("find --version", { encoding: "utf8" }).includes("GNU");
  } catch {}

  return {
    env: env.NODE_ENV,
    nodeVersion: process.version,
    dependencies: {
      rg: rgOk,
      find: findOk,
    },
    recentEvents: getRecentEvents(),
  };
}

module.exports = { getStatus };
