# JsonFabrica examples

Worked examples for [JsonFabrica](https://jsonfabrica.com) — an API-first service
for generating realistic, synthetic JSON test data from reusable templates.

Each scenario is a small, runnable project: a set of templates, a batch spec that
wires them together with real relationships, and a script that calls the API and
writes the output.

## Setup

```bash
git clone https://github.com/ms-methos/jsonfabrica-examples
cd jsonfabrica-examples
cp .env.example .env        # then put your API key in it
```

Get an API key at [jsonfabrica.com](https://jsonfabrica.com) → Settings → API Keys.
No `npm install` needed — the scripts use only the Node standard library (Node 18+).

## Scenarios

| Scenario | What it shows |
|---|---|
| [`ecommerce`](scenarios/ecommerce) | customers, products, and orders that reference both — round-robin relations, fixed seed for reproducible output |
| [`saas-multitenant`](scenarios/saas-multitenant) | a tenant → user → project hierarchy, and the limit of index-based relations when you need same-tenant constraints |

```bash
npm run generate -- ecommerce
npm run generate -- saas-multitenant
```

Each writes `scenarios/<name>/out.json`.

## Also here

- [`scripts/playwright-global-setup.mjs`](scripts/playwright-global-setup.mjs) —
  seed a backend with a fixed relational dataset before a Playwright E2E run.

## The three concepts these examples use

**Templates** are JSON documents with `<functionName(args)>` placeholders —
`<getRandomFullName()>`, `<getRandomEmail()>`, `<getRandomNumber(500,50000)>`,
`<getRandomDate('2023-01-01','2024-12-31')>`, and
[~20 more](https://jsonfabrica.com/docs/functions). The engine fills them in.

**Sequences** (`<createSeq('name')>` / `<getSeq('name')>`) produce collision-free
incrementing values, tracked server-side per `sequenceNamespace` — so ids stay
unique across separate runs and parallel workers.

**Relations** in a batch wire generated documents together. A child document
declares which of its fields point at a parent:

```json
"relations": {
  "customerId": { "from": "customer.id", "strategy": "round-robin" }
}
```

After each child is generated, the engine overwrites `child.customerId` with a
real generated `customer.id`. `from` is a field path (`alias.field`); the only
strategy is `round-robin` (parents assigned by child index). Placeholder values
like `"customerId": 0` in the template just get replaced.

## Links

- Docs: https://jsonfabrica.com/docs
- Function reference: https://jsonfabrica.com/docs/functions
- API reference: https://jsonfabrica.com/docs/api-reference
- Batch endpoint: https://jsonfabrica.com/docs/api-reference/batches
- OpenAPI spec: https://jsonfabrica.com/openapi.yaml

## License

MIT
