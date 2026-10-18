# nc-protocol

Public wire contracts, Model Context Protocol (MCP) tool schemas, and agent
protocol definitions for [Node Command](https://nodecommand.app).

This repository is the canonical source of truth for the public Node Command
contracts. It contains strictly declarative schemas and contracts: no
proprietary server code, no database schemas, and no secrets.

Consumers — the Node Command hub, the
[`nc-agent`](https://github.com/huseyincig/nc-agent) runtime, and client
integrations — vendor this repository at a pinned commit, so contract
changes here are explicit and auditable.

---

## Namespaces

```text
agent/     Hub ↔ Agent wire protocol (hello / welcome / request / reply / heartbeat)
mcp/       Model-facing MCP surface (tool schemas + canonical tool manifest)
policy/    Public host-policy projection + capability names
browser/   Public browser and egress policy schemas
bindings/  Generated language bindings (JavaScript ESM)
```

---

## Consuming the contracts

There is no runtime dependency to install: consumers vendor this repository
at a pinned commit SHA and import from the vendored tree.

```bash
git clone https://github.com/huseyincig/nc-protocol.git
```

Import the JavaScript bindings directly:

```javascript
import {
  MCP_TOOL_CONTRACT_VERSION,
  MCP_TOOL_MANIFEST_FINGERPRINT,
  MCP_TOOL_NAMES,
  HOST_POLICY_CAPABILITY_NAMES
} from './nc-protocol/bindings/javascript/contracts.mjs';
```

JSON schemas can be imported by path:

```javascript
import helloSchema from './nc-protocol/agent/hello.schema.json' with { type: 'json' };
import toolsIndex from './nc-protocol/mcp/tools/index.json' with { type: 'json' };
```

The current contract version, fingerprint, and capability list are pinned in
`mcp/contract-version`, `mcp/fingerprint`, and `policy/capability-names`;
the current generation and rollout rules are in
[COMPATIBILITY.md](COMPATIBILITY.md).

---

## Testing & Validation

`nc-protocol` has zero runtime dependencies and uses the native Node.js
test runner:

```bash
# Clone the repository
git clone https://github.com/huseyincig/nc-protocol.git
cd nc-protocol

# Run test suite
npm test
# Or:
node --test tests/*.mjs
```

The test suite validates:

1. Presence of all required namespace files.
2. Exact matching between tool definitions, `mcp/tools/index.json`, and tool count.
3. Cryptographic consistency of the canonical `sha256` manifest fingerprint.
4. Schema parse validity and schema draft conformance.
5. Binding parity with declarative contract files.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to
propose new tools, update schemas, recompute fingerprints, and submit pull
requests.

---

## Versioning & Compatibility

- [VERSIONING.md](VERSIONING.md) — SemVer lifecycle and breaking-change policies.
- [COMPATIBILITY.md](COMPATIBILITY.md) — Current contract generations and rollout gates.

---

## Related repositories

- [NodeCommand](https://github.com/huseyincig/NodeCommand) — product
  documentation, client examples, and manifests.
- [nc-agent](https://github.com/huseyincig/nc-agent) — the open-source host
  agent and CLI installer that implements these contracts.

---

## License

Apache-2.0 — see [LICENSE](LICENSE).
