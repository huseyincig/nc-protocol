# Compatibility

Current generation:

```text
agent protocol:  1.0.0
MCP contract:    11.19.0 (46 tools, fingerprint in mcp/fingerprint)
host policy:     1.0.0 (22 capabilities, see policy/capability-names)
```

Rules (release gate enforced):

1. Platform cannot release against an unsupported protocol major.
2. Agents cannot roll out against an unsupported protocol major.
3. Platform supports current + previous agent during rollout windows.
4. Old agent support is removed only after rollout completes.
5. Breaking protocol changes never go straight to the fleet.
6. Mismatches fail at the release gate, never in production.
