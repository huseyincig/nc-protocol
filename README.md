# nc-protocol

Public wire contracts shared by the NC agent and the NC hub. Canonical
contract source. No business logic, no database schemas, no secrets.

## Namespaces

```text
agent/    Hub ↔ Agent wire protocol (hello/welcome/request/reply/heartbeat)
mcp/      Model-facing MCP surface (tool names + input/output schemas)
policy/   Public host-policy projection + capability names
browser/  Public browser/egress policy
bindings/ Generated language bindings (JavaScript)
```

## Rules

- The agent ↔ hub protocol and the MCP lifecycle are separate namespaces
  and never mixed. The agent protocol is NC-internal; `mcp/` follows the
  MCP Specification 2026-07-28 (stateless model).
- Breaking wire changes bump MAJOR (see `VERSIONING.md`).
- `mcp/fingerprint` pins the exact tool manifest (`sha256:…`).
- Consumers pin `mcp/contract-version`; unknown tool names are treated as
  high-risk by the hub rate limiter.
