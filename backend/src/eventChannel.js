const fs = require("node:fs");
const path = require("node:path");
const logger = require("./logger");

const channelConfig = process.env.EVENT_CHANNEL;

let writeFn = null;
let cleanupFn = null;
const recentEvents = [];
const MAX_RECENT_EVENTS = 5;

function noop() {}

function createStdoutWriter(stream) {
  return (data) => {
    stream.write(`${data}\n`);
  };
}

function createFileWriter(filePath) {
  // Ensure parent directory exists for regular files.
  // (Safe even if target is a FIFO.)
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch {
    // TODO: do something with the error
  }

  // Fail immediately if the target exists as a directory (e.g. Docker bind
  // mount of a non-existent file creates one). User must fix the setup.
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      logger.error(
        "cannot open path: is a directory, expected a regular file or FIFO",
        { filePath },
      );
      process.exit(1);
    }
  } catch {
    // Path does not exist yet — will be created by createWriteStream
  }

  let stream = null;
  let opening = false;
  let queue = [];
  let destroyed = false;

  function openStream() {
    if (stream || opening || destroyed) return;

    opening = true;

    const s = fs.createWriteStream(filePath, {
      flags: "a",
      encoding: "utf8",
      autoClose: true,
    });

    s.on("open", () => {
      opening = false;
      stream = s;

      // Flush queued events
      for (const item of queue) {
        stream.write(item);
      }

      queue = [];
    });

    s.on("error", (err) => {
      opening = false;
      stream = null;

      if (err.code === "EISDIR") {
        logger.error(
          "cannot open path: is a directory, expected a regular file or FIFO",
          { filePath },
        );
        process.exit(1);
        return;
      }

      logger.error("event-channel stream error", { err });

      // Retry later
      setTimeout(openStream, 1000);
    });

    s.on("close", () => {
      stream = null;

      // FIFOs may disconnect when reader disappears.
      // Reopen automatically if still active.
      if (!destroyed) {
        setTimeout(openStream, 1000);
      }
    });
  }

  openStream();

  const write = (data) => {
    const line = `${data}\n`;

    // If stream not ready yet, buffer events
    if (!stream) {
      queue.push(line);

      // Prevent unbounded memory growth
      if (queue.length > 1000) {
        queue.shift();
      }

      openStream();
      return;
    }

    const ok = stream.write(line);

    // Backpressure handling
    if (!ok) {
      stream.once("drain", noop);
    }
  };

  const cleanup = () => {
    destroyed = true;

    if (stream) {
      stream.end();
    }
  };

  return { write, cleanup };
}

// To add a new transport (Redis, TCP, etc.), create a factory function
// like createStdoutWriter/createFileWriter that returns { write, cleanup },
// then add an else-if branch below matching the EVENT_CHANNEL scheme.

if (!channelConfig) {
  writeFn = null;
} else if (channelConfig === "stdout") {
  writeFn = createStdoutWriter(process.stdout);
} else if (channelConfig === "stderr") {
  writeFn = createStdoutWriter(process.stderr);
} else if (channelConfig.startsWith("file://")) {
  const url = new URL(channelConfig);
  const filePath = url.pathname;

  const { write, cleanup } = createFileWriter(filePath);

  writeFn = write;
  cleanupFn = cleanup;
} else {
  logger.error("unsupported event channel", { channel: channelConfig });
  process.exit(1);
}

function emit(event) {
  logger.debug("event emitted", { event });

  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.shift();
  }

  if (!writeFn) return;

  try {
    writeFn(JSON.stringify(event));
  } catch (err) {
    logger.error("event-channel emit failed", { err });
  }
}

function getRecentEvents() {
  return recentEvents;
}

function shutdown() {
  if (cleanupFn) {
    cleanupFn();
  }
}

process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

module.exports = { emit, getRecentEvents };
