import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export async function createExecutionDir() {
  return mkdtemp(path.join(tmpdir(), "talentiq-run-"));
}

export async function writeSourceFile(directory, fileName, code) {
  const filePath = path.join(directory, fileName);
  await writeFile(filePath, code, "utf8");
  return filePath;
}

export async function cleanupExecutionDir(directory) {
  if (!directory) return;
  await rm(directory, {
    recursive: true,
    force: true
  });
}
