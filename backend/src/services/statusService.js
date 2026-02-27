const { execSync } = require('child_process');
const { getRecentEvents } = require('../eventChannel');

function getStatus() {
  let grepOk = false, findOk = false;
  try {
    grepOk = execSync('grep --version', { encoding: 'utf8' }).includes('GNU');
  } catch {}
  try {
    findOk = execSync('find --version', { encoding: 'utf8' }).includes('GNU');
  } catch {}

  return {
    env: process.env.NODE_ENV || null,
    nodeVersion: process.version,
    dependencies: {
      grep: grepOk,
      find: findOk,
    },
    recentEvents: getRecentEvents(),
  };
}

module.exports = { getStatus };
