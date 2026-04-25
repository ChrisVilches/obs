const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { parseFindSearchOutput, parseRgOutput } = require("../lib/fileUtils");

const execFileAsync = promisify(execFile);

async function searchFiles(rootDir, query) {
  let files = [];
  try {
    const { stdout } = await execFileAsync(
      "find",
      [
        rootDir,
        "-type",
        "f",
        "-iname",
        `*${query}*`,
        "!",
        "-name",
        ".*",
        "!",
        "-path",
        "*/.*",
      ],
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
    );
    files = parseFindSearchOutput(stdout, rootDir);
  } catch (e) {
    console.error(e);
  }

  let contentMatches = [];
  try {
    const { stdout } = await execFileAsync("rg", ["-lFi", query, rootDir], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    contentMatches = parseRgOutput(stdout, rootDir, 50);
  } catch (err) {
    contentMatches = parseRgOutput(err.stdout || "", rootDir, 50);
  }

  return { files, contentMatches };
}

module.exports = { searchFiles };
