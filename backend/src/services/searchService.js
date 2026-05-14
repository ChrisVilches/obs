const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

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
  } catch (_) {}

  let contentMatches = [];
  try {
    const escapedQuery = query.replace(/'/g, "'\\''");
    const cmd = `grep -srilF '${escapedQuery}' '${rootDir}' --exclude-dir='.*' --exclude='.*' | head -n 50`;
    const { stdout } = await execFileAsync('sh', ['-c', cmd], { encoding: 'utf-8' });
    contentMatches = stdout.trim().split('\n').filter(Boolean).map(f => path.relative(rootDir, f));
  } catch (err) {
    contentMatches = (err.stdout || '').trim().split('\n').filter(Boolean).map(f => path.relative(rootDir, f));
  }

  const fileSet = new Set(files);
  contentMatches = contentMatches.filter(f => !fileSet.has(f));

  return { files, contentMatches };
}

module.exports = { searchFiles };
