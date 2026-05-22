const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

function getStatus() {
  let grepOk = false, findOk = false;
  try {
    grepOk = execSync('grep --version', { encoding: 'utf8' }).includes('GNU');
  } catch {}
  try {
    findOk = execSync('find --version', { encoding: 'utf8' }).includes('GNU');
  } catch {}

  let commitHash = null;
  try {
    commitHash = fs.readFileSync(path.join(__dirname, '..', '..', '..', '.git', 'refs', 'heads', 'main'), 'utf8').trim();
  } catch {}

  let nvmrcVersion = null;
  try {
    nvmrcVersion = fs.readFileSync(path.join(__dirname, '..', '..', '..', '.nvmrc'), 'utf8').trim();
  } catch {}

  return {
    commitHash,
    nodeEnv: process.env.NODE_ENV || null,
    nodeVersion: process.version,
    nvmrcVersion,
    nodeMatch: nvmrcVersion ? process.version === nvmrcVersion : null,
    dependencies: {
      grep: grepOk,
      find: findOk,
    },
  };
}

module.exports = { getStatus };
