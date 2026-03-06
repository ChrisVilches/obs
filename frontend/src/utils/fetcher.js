function withJsonHeaders(opts) {
  const headers = new Headers(opts.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return { ...opts, headers };
}

function withSerializedBody(opts) {
  if (opts.body && typeof opts.body === "object") {
    return { ...opts, body: JSON.stringify(opts.body) };
  }
  return opts;
}

async function parseResponse(res) {
  // 204 No Content (and similar) have no body — return null rather than
  // attempting a parse that will throw or produce garbage.
  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    return null;
  }

  const contentType = res.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    // Let JSON parse errors surface — a malformed body is a real problem,
    // not something that should silently collapse to {}.
    return res.json();
  }

  // Non-JSON response (plain text, HTML error pages, etc.).
  // Return as a plain object so callers always get a consistent shape.
  const text = await res.text();
  return { raw: text };
}

function createHttpError(data, res) {
  const message = (data && data.error) || `HTTP ${res.status}`;
  const error = new Error(message);
  error.status = res.status;

  // Spread caller data under a dedicated key so we never shadow Error
  // built-ins (message, stack, name) or the status we just set.
  error.data = data;

  return error;
}

export async function fetcher(url, opts = {}) {
  const finalOpts = withSerializedBody(withJsonHeaders(opts));
  const res = await fetch(url, finalOpts);
  const data = await parseResponse(res);
  if (!res.ok) throw createHttpError(data, res);
  return data;
}
