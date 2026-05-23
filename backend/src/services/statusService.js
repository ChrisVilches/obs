const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const execAsync = promisify(exec);

const { getRecentEvents } = require("../eventChannel");
const env = require("../env");

async function getStatus() {
  let rgOk = false,
    findOk = false;
  try {
    const { stdout } = await execAsync("rg --version", { encoding: "utf8" });
    rgOk = stdout.includes("ripgrep");
  } catch {}
  try {
    const { stdout } = await execAsync("find --version", { encoding: "utf8" });
    findOk = stdout.includes("GNU");
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
