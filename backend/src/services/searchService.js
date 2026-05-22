const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// TODO: Searching by content isn't working in production I think.
async function searchFiles(rootDir, query) {
  let files = [];
  try {
    const { stdout } = await execFileAsync('find', [
      rootDir,
      '-type', 'f',
      '-iname', `*${query}*`,
      '!', '-name', '.*',
      '!', '-path', '*/.*',
    ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    files = stdout.trim().split('\n').filter(Boolean).map(f => path.relative(rootDir, f));
  } catch (e) {
    console.error(e)
  }

  let contentMatches = [];
  try {
    const escapedQuery = query.replace(/'/g, "'\\''");
    const cmd = `grep -srilFI '${escapedQuery}' '${rootDir}' --exclude-dir='.*' --exclude='.*' | head -n 50`;
    const { stdout } = await execFileAsync('sh', ['-c', cmd], { encoding: 'utf-8' });
    contentMatches = stdout.trim().split('\n').filter(Boolean).map(f => path.relative(rootDir, f));
  } catch (err) {
    contentMatches = (err.stdout || '').trim().split('\n').filter(Boolean).map(f => path.relative(rootDir, f));
  }

  return { files, contentMatches };
}

module.exports = { searchFiles };
