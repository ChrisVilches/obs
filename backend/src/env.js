const { z } = require("zod");
const fs = require("node:fs");

const dataRootSchema = z
  .string()
  .min(1, "DATA_ROOT_DIR must be a non-empty string")
  .refine(
    (dir) => {
      try {
        return fs.statSync(dir).isDirectory();
      } catch {
        return false;
      }
    },
    { message: "DATA_ROOT_DIR does not exist or is not accessible" },
  );

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATA_ROOT_DIR: dataRootSchema,
  CONFIG_PATH: z.string().min(1, "CONFIG_PATH must be a non-empty string"),
  EVENT_CHANNEL: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z
      .string()
      .refine((val) => {
        if (val === "stdout" || val === "stderr") return true;
        if (!val.startsWith("file://")) return false;
        if (val.endsWith("/")) return false;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }, "EVENT_CHANNEL must be 'stdout', 'stderr', or a valid 'file:///absolute/path' (not a directory)")
      .optional(),
  ),
});

const env = envSchema.parse(process.env);

module.exports = env;
module.exports.envSchema = envSchema;
