# Multi-tenant SaaS scenario

A three-level hierarchy: **tenants** → **users** → **projects**.

| Template | Count | Relations |
|---|---|---|
| `templates/tenant.json` | 8 | — |
| `templates/user.json` | 40 | `tenantId` → `tenant.id` |
| `templates/project.json` | 25 | `tenantId` → `tenant.id`, `ownerUserId` → `user.id` |

## Run it

```bash
npm run generate -- saas-multitenant
```

## A limit worth knowing

Relations are resolved **round-robin by index**, not by a constraint. Each
`project` gets *some* `tenant.id` and *some* `user.id`, but nothing guarantees
that project's owner belongs to that project's tenant.

If you need "the owner must be a user of the same tenant", the options are:

1. Generate one batch **per tenant** (tenant count 1, its users, its projects) —
   then every relation inside the batch is within that tenant by construction.
2. Post-process the output: after generation, reassign `ownerUserId` to a user
   whose `tenantId` matches.

Option 1 is usually cleaner — loop over tenants and call the batch endpoint once
each with a distinct `sequenceNamespace`.
