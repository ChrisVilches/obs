function defaultJsonHeaders(opts) {
  opts.headers = opts.headers || {};
  if (!opts.headers['Content-Type']) {
    opts.headers['Content-Type'] = 'application/json';
  }
}

function autoSerializeBody(opts) {
  if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify(opts.body);
  }
}

async function parseResponse(res) {
  // TODO: not sure about this. Must be audited.
  // there's a weird catch() (shouldn't use things like that, do everything async/await)
  return res.json().catch(() => ({}));
}

function createHttpError(data, res) {
  const error = new Error(data.error || `HTTP ${res.status}`);
  error.status = res.status;
  Object.assign(error, data);
  return error;
}

export async function fetcher(...args) {
  const [url, opts = {}] = args;
  defaultJsonHeaders(opts);
  autoSerializeBody(opts);
  const res = await fetch(url, opts);
  const data = await parseResponse(res);
  if (!res.ok) throw createHttpError(data, res);
  return data;
}
