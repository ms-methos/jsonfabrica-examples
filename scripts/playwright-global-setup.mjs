// Example: seed a backend before a Playwright E2E run.
//
// Wire it into playwright.config.ts:
//
//   export default defineConfig({
//     globalSetup: require.resolve('./scripts/playwright-global-setup.mjs'),
//   });
//
// It generates a fixed, relational dataset and writes it to
// e2e/fixtures/seeded.json. A fixed `seed` means ids and values are identical
// on every run, so specs can assert exact values. `loadIntoBackend()` is a
// stub — that part is your application's own reset + insert code.

import { writeFile, mkdir } from 'node:fs/promises';
import { createTemplate, runBatch } from '../lib/jsonfabrica.mjs';

const CUSTOMER = `{
  "id": "<createSeq('e2e_customer')>",
  "name": "<getRandomFullName()>",
  "email": "<getRandomEmail('example.test')>"
}`;

const ORDER = `{
  "id": "<createSeq('e2e_order')>",
  "customerId": 0,
  "total": "<getRandomNumber(1000, 50000)>",
  "status": "<getRandomElement('paid','shipped','delivered')>"
}`;

async function loadIntoBackend(data) {
  // TODO: replace with your app's real reset + insert.
  // e.g. await resetTestDatabase(); await api.post('/test/seed', data);
  console.log(`[e2e seed] would load ${data.customer.length} customers, ${data.order.length} orders`);
}

export default async function globalSetup() {
  const customerId = await createTemplate('e2e/customer', CUSTOMER);
  const orderId = await createTemplate('e2e/order', ORDER);

  const data = await runBatch({
    seed: 424242,
    sequenceNamespace: `e2e-${process.env.TEST_PARALLEL_INDEX ?? '0'}`,
    documents: [
      { templateId: customerId, alias: 'customer', count: 5 },
      {
        templateId: orderId,
        alias: 'order',
        count: 15,
        relations: { customerId: { from: 'customer.id', strategy: 'round-robin' } },
      },
    ],
  });

  await loadIntoBackend(data);

  await mkdir('e2e/fixtures', { recursive: true });
  await writeFile('e2e/fixtures/seeded.json', JSON.stringify(data, null, 2) + '\n');
  console.log('[e2e seed] wrote e2e/fixtures/seeded.json');
}
