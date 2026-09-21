const test = require("node:test");
const assert = require("node:assert/strict");

const {
  parseXshellCommandLine,
  redactXshellCommandLinePasswords,
} = require("./xshellCommandLine.cjs");

test("parseXshellCommandLine accepts -url with OTP-style passwords and -newtab metadata", () => {
  const parsed = parseXshellCommandLine([
    "Netcatty.exe",
    "-url",
    "ssh://root:OTP:0pBCzWslgRIR@192.168.1.122:22",
    "-newtab",
    "root@192.168.1.122",
  ]);
  const { consumedIndices, ...result } = parsed ?? {};
  assert.deepEqual(result, {
    protocol: "ssh",
    url: "ssh://root:OTP%3A0pBCzWslgRIR@192.168.1.122:22",
    hostname: "192.168.1.122",
    username: "root",
    password: "OTP:0pBCzWslgRIR",
    port: 22,
  });
  assert.deepEqual(Array.from(consumedIndices ?? []), [1, 2, 3, 4]);
});

test("parseXshellCommandLine does not claim -url when it is another flag's value", () => {
  assert.equal(parseXshellCommandLine([
    "Netcatty.exe",
    "-ssh",
    "-pw",
    "-url",
    "ssh://root:secret@host",
  ]), null);
});

test("parseXshellCommandLine rejects unsupported -url schemes", () => {
  assert.equal(parseXshellCommandLine([
    "Netcatty.exe",
    "-url",
    "jms://payload",
  ]), null);
});

test("redactXshellCommandLinePasswords masks passwords embedded in -url values", () => {
  const argv = [
    "Netcatty.exe",
    "-url",
    "ssh://root:OTP:0pBCzWslgRIR@192.168.1.122:22",
    "-newtab",
    "root@192.168.1.122",
  ];
  redactXshellCommandLinePasswords(argv);
  assert.equal(argv[2], "ssh://root:********@192.168.1.122:22");
});
