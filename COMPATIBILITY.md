# Compatibility

Current generation:

```text
agent protocol:  1.0.0
MCP contract:    12.3.0 (52 authoring definitions, fingerprint in mcp/fingerprint)
host policy:     1.0.0 (22 capabilities, see policy/capability-names)
```

Rules (release gate enforced):

1. Platform cannot release against an unsupported protocol major.
2. Agents cannot roll out against an unsupported protocol major.
3. Platform supports current + previous agent during rollout windows.
4. Old agent support is removed only after rollout completes.
5. Breaking protocol changes never go straight to the fleet.
6. Mismatches fail at the release gate, never in production.

## Public MCP discovery

The hosted platform composes 28 public `nc_` tools from this authoring inventory;
role/scope filtering can return fewer. Four lifecycle definitions are withheld
from public discovery. A raw authoring definition is not a callable-name promise.

Contract 12 introduced the approved one-time prelaunch direct cutover to this
surface. Retired public names are rejected rather than served through a parallel
legacy catalog. This exception concerns the public MCP presentation, not agent
wire compatibility or permission checks. Version 12.1 corrects validation and
descriptions without adding public tools or changing the agent protocol.
