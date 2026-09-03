// Run a scenario's batch and write the result to <scenario>/out.json.
//
//   npm run generate -- ecommerce
//   npm run generate -- saas-multitenant
//
// Reads scenarios/<name>/batch.json, creates each referenced template,
// substitutes the real templateIds, runs the batch, writes out.json.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTemplate, runBatch } from '../lib/jsonfabrica.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const name = process.argv[2];
if (!name) {
  console.error('Usage: npm run generate -- <scenario>   (e.g. ecommerce, saas-multitenant)');
  process.exit(1);
}

const scenarioDir = join(ROOT, 'scenarios', name);
const spec = JSON.parse(await readFile(join(scenarioDir, 'batch.json'), 'utf8'));

console.log(`[${name}] creating ${spec.documents.length} templates...`);
const documents = [];
for (const doc of spec.documents) {
  const body = await readFile(join(scenarioDir, doc.template), 'utf8');
  const templateId = await createTemplate(`examples/${name}/${doc.alias}`, body);
  console.log(`  ${doc.alias.padEnd(10)} -> ${templateId}`);
  documents.push({
    templateId,
    alias: doc.alias,
    count: doc.count,
    ...(doc.relations ? { relations: doc.relations } : {}),
  });
}

const batchSpec = {
  ...(spec.seed !== undefined ? { seed: spec.seed } : {}),
  ...(spec.sequenceNamespace ? { sequenceNamespace: spec.sequenceNamespace } : {}),
  documents,
};

console.log(`[${name}] running batch (${documents.reduce((n, d) => n + d.count, 0)} documents)...`);
const byAlias = await runBatch(batchSpec);

const outPath = join(scenarioDir, 'out.json');
await writeFile(outPath, JSON.stringify(byAlias, null, 2) + '\n');

for (const [alias, rows] of Object.entries(byAlias)) {
  console.log(`  ${alias.padEnd(10)} ${rows.length} rows`);
}
console.log(`[${name}] wrote ${outPath}`);
