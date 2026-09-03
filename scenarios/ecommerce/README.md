# E-commerce scenario

Three related entities: **customers**, **products**, and **orders** that
reference both.

| Template | Count | Notes |
|---|---|---|
| `templates/customer.json` | 20 | `id` from a sequence, so ids are stable and collision-free across runs in the same `sequenceNamespace` |
| `templates/product.json` | 15 | `priceCents` as an integer, `inStock` biased 80% true |
| `templates/order.json` | 60 | `customerId` / `productId` are placeholders (`0`) — the batch **relations** map overwrites them after generation |

## How the relations work

In `batch.json`, the `order` document declares:

```json
"relations": {
  "customerId": { "from": "customer.id", "strategy": "round-robin" },
  "productId":  { "from": "product.id",  "strategy": "round-robin" }
}
```

After each order is generated from its template, the engine replaces
`order.customerId` with a real generated `customer.id` and `order.productId`
with a real generated `product.id`. Parents are assigned round-robin by order
index, so all 60 orders spread evenly across the 20 customers and 15 products —
no orphaned foreign keys, no post-hoc stitching in your seed script.

`from` is a **field path** (`alias.field`), not just the alias — `"customer.id"`
pulls the `id`, `"customer"` alone would inject the whole customer object.

## Run it

```bash
npm run generate -- ecommerce
```

Writes `scenarios/ecommerce/out.json` with `{ customer: [...], product: [...], order: [...] }`.
Because `seed` is fixed in `batch.json`, every run produces identical data —
change or remove it for fresh data.
