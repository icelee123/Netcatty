const {
  PUTTY_VALUE_FLAGS,
  isElectronNoiseArg,
  toDeepLinkUrl,
} = require("./puttyCommandLine.cjs");

const SSH_PROTOCOL = "ssh";
const TELNET_PROTOCOL = "telnet";

function decodeUrlComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseXshellUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return null;

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const protocol = parsed.protocol.replace(/:$/, "");
  if (protocol !== SSH_PROTOCOL && protocol !== TELNET_PROTOCOL) return null;

  const hostname = parsed.hostname.replace(/^\[(.*)\]$/, "$1").trim();
  if (!hostname) return null;

  const portText = parsed.port;
  const port = portText ? Number(portText) : undefined;
  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    return null;
  }

  const username = parsed.username
    ? decodeUrlComponent(parsed.username).trim() || undefined
    : undefined;
  const password = parsed.password ? decodeUrlComponent(parsed.password) : undefined;

  return {
    protocol,
    url: toDeepLinkUrl({ protocol, username, password, hostname, port }),
    hostname,
    ...(username ? { username } : {}),
    ...(password !== undefined ? { password } : {}),
    ...(port ? { port } : {}),
  };
}

function findValueOperandIndices(argv, initialIndices) {
  const indices = new Set(initialIndices ?? []);
  for (let index = 0; index < argv.length; index += 1) {
    if (!PUTTY_VALUE_FLAGS.has(argv[index]) || typeof argv[index + 1] !== "string") continue;
    indices.add(index + 1);
  }
  return indices;
}

function parseXshellCommandLine(argv, { valueOperandIndices } = {}) {
  if (!Array.isArray(argv)) return null;

  const operandIndices = findValueOperandIndices(argv, valueOperandIndices);
  const consumedIndices = new Set();
  let target;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (typeof arg !== "string" || !arg || isElectronNoiseArg(arg, index, argv)) continue;
    if (operandIndices.has(index)) continue;

    if (arg === "-url") {
      const value = argv[index + 1];
      if (typeof value !== "string") return null;
      const parsed = parseXshellUrl(value);
      if (!parsed || target) return null;
      target = parsed;
      consumedIndices.add(index);
      consumedIndices.add(index + 1);
      index += 1;
      continue;
    }

    if (arg === "-newtab") {
      consumedIndices.add(index);
      if (typeof argv[index + 1] === "string") {
        consumedIndices.add(index + 1);
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("-")) return null;
  }

  return target ? { ...target, consumedIndices } : null;
}

function redactXshellCommandLinePasswords(argv) {
  if (!Array.isArray(argv)) return argv;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "-url") continue;
    const next = argv[index + 1];
    if (typeof next !== "string" || !next.trim()) continue;
    try {
      const parsed = new URL(next.trim());
      if (!parsed.password) continue;
      const passwordLength = decodeUrlComponent(parsed.password).length;
      parsed.password = "*".repeat(Math.min(passwordLength, 8)) || "********";
      argv[index + 1] = parsed.toString();
    } catch {
      // Invalid URLs are not credentials in a known format.
    }
  }
  return argv;
}

module.exports = {
  parseXshellCommandLine,
  redactXshellCommandLinePasswords,
};
