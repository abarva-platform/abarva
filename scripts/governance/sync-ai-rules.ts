import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const HEADER =
  'AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY. To update: edit AGENTS.md, then run npm run sync-ai-rules';

const root = process.cwd();
const sourcePath = path.join(root, 'AGENTS.md');
const targets = [
  {
    filePath: path.join(root, '.cursor', 'rules'),
    markdown: false,
  },
  {
    filePath: path.join(root, '.github', 'copilot-instructions.md'),
    markdown: true,
  },
];

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function writeIfChanged(filePath: string, content: string): Promise<boolean> {
  const current = await readIfExists(filePath);
  if (current === content) return false;

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
  return true;
}

async function main() {
  const agents = await readFile(sourcePath, 'utf8');
  const results = await Promise.all(
    targets.map(async (target) => ({
      targetPath: target.filePath,
      changed: await writeIfChanged(target.filePath, buildGeneratedContent(agents, target.markdown)),
    })),
  );

  for (const result of results) {
    const relativePath = path.relative(root, result.targetPath);
    console.log(`${result.changed ? 'updated' : 'unchanged'} ${relativePath}`);
  }
}

function buildGeneratedContent(agents: string, markdown: boolean): string {
  if (!markdown) return `${HEADER}\n\n${agents.trimEnd()}\n`;

  return `${HEADER}\n\n<!-- prettier-ignore-start -->\n\n${agents.trimEnd()}\n\n<!-- prettier-ignore-end -->\n`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
