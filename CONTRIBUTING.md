# Contributing to nc-protocol

`nc-protocol` defines the canonical public wire contracts, Model Context Protocol (MCP) tool schemas, and agent protocol definitions for the Node Command platform.

This repository is strictly declarative: no runtime services, database schemas, or proprietary logic. All consumers (the Node Command agent, control plane, and client integrations) treat `nc-protocol` as the authoritative source of truth.

---

## Repository Structure

```text
nc-protocol/
├── agent/             # Hub ↔ Agent wire protocol JSON schemas (hello, request, reply, etc.)
├── browser/           # Public browser egress and execution policy schemas
├── bindings/          # Generated client language bindings (JavaScript)
├── mcp/
│   ├── contract-version # SemVer contract version string (e.g. 11.22.0)
│   ├── fingerprint      # Pinned SHA-256 fingerprint of canonical tool manifest
│   └── tools/           # Canonical MCP tool definitions (<tool_name>.json + index.json)
├── policy/            # Host policy schemas and capability enumeration
└── tests/             # Contract verification suite (node:test)
```

---

## Proposing a Tool or Schema Change

All changes must preserve strict backward compatibility unless a major version bump is formally approved.

### 1. Classification & Design
- **Atomic Tool**: Standalone single-purpose tool (e.g. `system_snapshot`, `disk_usage`).
- **Multi-Action Tool**: Consolidated domain tool using an action discriminator (e.g. `service_manage`, `process_manage`, `browser_manage`).
- **Description Budget**: Tool descriptions must be between 100 and 350 characters, accurately describing capabilities without internal topology, secrets, or implementation details.

### 2. File Updates
When modifying or adding a tool:
1. **Tool Schema**: Create or edit `mcp/tools/<tool_name>.json`. Schemas must be valid JSON Schema (Draft-07 / 2020-12 compatible), declare `type: "object"`, and specify explicit bounds on strings, arrays, and numbers.
2. **Index**: If adding or removing a tool, update the `tools` array in `mcp/tools/index.json`.
3. **Version Bump**: Bump the contract version in `mcp/contract-version` and `mcp/tools/index.json` according to [VERSIONING.md](VERSIONING.md).
4. **Fingerprint**: Recompute the canonical SHA-256 manifest hash and update both `mcp/fingerprint` and `mcp/tools/index.json`.
5. **Bindings**: Update `bindings/javascript/contracts.mjs` so `MCP_TOOL_CONTRACT_VERSION`, `MCP_TOOL_MANIFEST_FINGERPRINT`, and `MCP_TOOL_NAMES` match.

### 3. Agent Protocol & Policy Changes
- Changes to `agent/*.schema.json` must preserve protocol version compatibility (major-gated at `1.0.0`).
- Changes to `policy/capability-names` must be documented and stay in sync with `bindings/javascript/contracts.mjs`.

---

## Local Verification

Run the test suite using native Node.js (no dependencies required):

```bash
# Run all contract tests
npm test
# Or directly:
node --test tests/*.mjs
```

The test runner verifies:
- All required namespace files exist.
- Tool count and manifest listings match exactly.
- The manifest fingerprint matches the canonical SHA-256 hash calculated from all tool definitions.
- JavaScript bindings are consistent with JSON files.
- All agent schemas parse correctly and validate required identity fields.

---

## Submitting a Pull Request

1. Fork the repository and create a feature branch (`git checkout -b feature/my-tool-proposal`).
2. Make your edits and ensure `npm test` passes with zero failures.
3. Commit with a clear, descriptive message (`feat(mcp): propose new foo_tool schema`).
4. Submit a Pull Request targeting `main`. Fill out the PR template completely.

All contributions are licensed under Apache-2.0.
