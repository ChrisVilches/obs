const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

// env.js calls envSchema.parse(process.env) at require time, so set these
// before the require to avoid a startup crash.
process.env.DATA_ROOT_DIR = os.tmpdir();
process.env.CONFIG_PATH = "test-config";

const { envSchema } = require("../src/env");

function makeEnv(overrides = {}) {
  return {
    DATA_ROOT_DIR: os.tmpdir(),
    CONFIG_PATH: "obsidian",
    ...overrides,
  };
}

describe("envSchema (valid)", () => {
  it("accepts a minimal valid config", () => {
    const result = envSchema.parse(makeEnv());
    assert.equal(result.PORT, 5000);
    assert.equal(result.NODE_ENV, "development");
    assert.equal(result.DATA_ROOT_DIR, os.tmpdir());
    assert.equal(result.CONFIG_PATH, "obsidian");
    assert.equal(result.EVENT_CHANNEL, undefined);
  });

  it("accepts all fields explicitly set", () => {
    const result = envSchema.parse(
      makeEnv({
        PORT: "3000",
        NODE_ENV: "production",
        EVENT_CHANNEL: "stdout",
      }),
    );
    assert.equal(result.PORT, 3000);
    assert.equal(result.NODE_ENV, "production");
    assert.equal(result.EVENT_CHANNEL, "stdout");
  });

  it("coerces PORT from string to number", () => {
    const result = envSchema.parse(makeEnv({ PORT: "8080" }));
    assert.equal(typeof result.PORT, "number");
    assert.equal(result.PORT, 8080);
  });

  it("accepts EVENT_CHANNEL=stdout", () => {
    const result = envSchema.parse(makeEnv({ EVENT_CHANNEL: "stdout" }));
    assert.equal(result.EVENT_CHANNEL, "stdout");
  });

  it("accepts EVENT_CHANNEL=stderr", () => {
    const result = envSchema.parse(makeEnv({ EVENT_CHANNEL: "stderr" }));
    assert.equal(result.EVENT_CHANNEL, "stderr");
  });

  it("accepts EVENT_CHANNEL=file:// with a valid URL path", () => {
    const result = envSchema.parse(
      makeEnv({ EVENT_CHANNEL: "file:///var/log/events.json" }),
    );
    assert.equal(result.EVENT_CHANNEL, "file:///var/log/events.json");
  });

  it("accepts EVENT_CHANNEL=file:// with subdirectories", () => {
    const result = envSchema.parse(
      makeEnv({ EVENT_CHANNEL: "file:///home/user/logs/app/events" }),
    );
    assert.equal(result.EVENT_CHANNEL, "file:///home/user/logs/app/events");
  });

  it("treats empty EVENT_CHANNEL as undefined", () => {
    const result = envSchema.parse(makeEnv({ EVENT_CHANNEL: "" }));
    assert.equal(result.EVENT_CHANNEL, undefined);
  });

  it("treats null EVENT_CHANNEL as undefined", () => {
    const result = envSchema.parse(makeEnv({ EVENT_CHANNEL: null }));
    assert.equal(result.EVENT_CHANNEL, undefined);
  });

  it("accepts DATA_ROOT_DIR as dir that exists", () => {
    const dir = fs.mkdtempSync(`${os.tmpdir()}/env-test-`);
    try {
      const result = envSchema.parse(makeEnv({ DATA_ROOT_DIR: dir }));
      assert.equal(result.DATA_ROOT_DIR, dir);
    } finally {
      fs.rmdirSync(dir);
    }
  });

  it("accepts any non-empty CONFIG_PATH string", () => {
    const result = envSchema.parse(makeEnv({ CONFIG_PATH: "some/deep/path" }));
    assert.equal(result.CONFIG_PATH, "some/deep/path");
  });

  it("defaults PORT to 5000 when omitted", () => {
    const result = envSchema.parse(makeEnv());
    assert.equal(result.PORT, 5000);
  });

  it("defaults NODE_ENV to development when omitted", () => {
    const result = envSchema.parse(makeEnv());
    assert.equal(result.NODE_ENV, "development");
  });

  it("accepts NODE_ENV=test", () => {
    const result = envSchema.parse(makeEnv({ NODE_ENV: "test" }));
    assert.equal(result.NODE_ENV, "test");
  });
});

describe("envSchema (invalid)", () => {
  it("rejects missing DATA_ROOT_DIR", () => {
    const result = envSchema.safeParse(makeEnv({ DATA_ROOT_DIR: undefined }));
    assert.equal(result.success, false);
  });

  it("rejects empty DATA_ROOT_DIR", () => {
    const result = envSchema.safeParse(makeEnv({ DATA_ROOT_DIR: "" }));
    assert.equal(result.success, false);
  });

  it("rejects DATA_ROOT_DIR that does not exist", () => {
    // Generate a path that doesn't exist using a random suffix
    const nonexistent = `${os.tmpdir()}/does-not-exist-${Date.now()}-${Math.random()}`;
    const result = envSchema.safeParse(makeEnv({ DATA_ROOT_DIR: nonexistent }));
    assert.equal(result.success, false);
  });

  it("rejects DATA_ROOT_DIR that is a file, not a directory", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-test-"));
    const tempFile = path.join(tempDir, "plain-file.txt");
    fs.writeFileSync(tempFile, "not a dir");
    try {
      const result = envSchema.safeParse(makeEnv({ DATA_ROOT_DIR: tempFile }));
      assert.equal(result.success, false);
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it("rejects missing CONFIG_PATH", () => {
    const result = envSchema.safeParse(makeEnv({ CONFIG_PATH: undefined }));
    assert.equal(result.success, false);
  });

  it("rejects empty CONFIG_PATH", () => {
    const result = envSchema.safeParse(makeEnv({ CONFIG_PATH: "" }));
    assert.equal(result.success, false);
  });

  it("rejects invalid EVENT_CHANNEL value", () => {
    const result = envSchema.safeParse(makeEnv({ EVENT_CHANNEL: "invalid" }));
    assert.equal(result.success, false);
  });

  it("rejects EVENT_CHANNEL with missing colon in file scheme", () => {
    const result = envSchema.safeParse(
      makeEnv({ EVENT_CHANNEL: "file//missing-colon" }),
    );
    assert.equal(result.success, false);
  });

  it("rejects EVENT_CHANNEL with unsupported scheme like http", () => {
    const result = envSchema.safeParse(
      makeEnv({ EVENT_CHANNEL: "http://localhost:3000" }),
    );
    assert.equal(result.success, false);
  });

  it("rejects EVENT_CHANNEL with scheme not matching file://", () => {
    const result = envSchema.safeParse(
      makeEnv({ EVENT_CHANNEL: "ftp://example.com" }),
    );
    assert.equal(result.success, false);
  });

  it("rejects file:// path ending with a trailing slash (directory)", () => {
    const result = envSchema.safeParse(
      makeEnv({ EVENT_CHANNEL: "file:///var/log/" }),
    );
    assert.equal(result.success, false);
  });

  it("rejects malformed file:// URL", () => {
    const result = envSchema.safeParse(
      makeEnv({ EVENT_CHANNEL: "file://bad host/var/log" }),
    );
    assert.equal(result.success, false);
  });

  it("rejects negative PORT", () => {
    const result = envSchema.safeParse(makeEnv({ PORT: "-1" }));
    assert.equal(result.success, false);
  });

  it("rejects zero PORT", () => {
    const result = envSchema.safeParse(makeEnv({ PORT: "0" }));
    assert.equal(result.success, false);
  });

  it("rejects non-numeric PORT", () => {
    const result = envSchema.safeParse(makeEnv({ PORT: "abc" }));
    assert.equal(result.success, false);
  });

  it("rejects unsupported NODE_ENV", () => {
    const result = envSchema.safeParse(makeEnv({ NODE_ENV: "staging" }));
    assert.equal(result.success, false);
  });
});
