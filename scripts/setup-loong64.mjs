#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const requiredPlatform = "linux";
const requiredArch = "loong64";
const electronMirror = "https://github.com/darkyzhou/electron-loong64/releases/download/";
const electronVersion = "v42.3.0";

if (process.platform !== requiredPlatform || process.arch !== requiredArch) {
  console.error(
    `[setup:loong64] This setup script must run on ${requiredPlatform}-${requiredArch}; current host is ${process.platform}-${process.arch}.`,
  );
  process.exit(1);
}

const env = {
  ...process.env,
  ELECTRON_MIRROR: electronMirror,
  npm_config_electron_mirror: electronMirror,
  ELECTRON_CUSTOM_DIR: electronVersion,
  npm_config_electron_custom_dir: electronVersion,
  electron_use_remote_checksums: "1",
  npm_config_electron_use_remote_checksums: "1",
};

const result = spawnSync("npm", ["install"], {
  stdio: "inherit",
  env,
});

if (result.error) {
  console.error(`[setup:loong64] Failed to start npm: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
