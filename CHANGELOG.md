# Changelog

## 5.10.10 — 2026-09-10

PATCH, 51 tools, description-only (no schema shape changes):
browser_take_screenshot documents the real oversize behavior (PNG->JPEG
retry, inline base64 budget vs artifact file size, bytes = original base64
length, session-close sweep).

## 5.10.9 — 2026-09-10

PATCH, 51 tools. P2 hardening close-out: audit_query status filter enum
(success|failure, writer-closed set); process_start env propertyNames
maxLength 256 (value caps deliberately NOT added — no runtime enforcement
exists and legit values can be large).

## 5.10.8 — 2026-09-10

PATCH, 51 tools. From-scratch audit thaw #3:
shell_exec + privileged_shell_exec outputs normalized to the compact
public envelope (runtime stops returning the raw internal job row;
central projects {client_id,job_id,status,exit_code,stdout,stderr,
duration_ms,timed_out,error}; privileged drops ghost elevation_tier).
process_input/process_terminate/log_follow_start/log_follow_read/
log_follow_stop flattened to verified runtime truth (start/read carry
eof; read carries truncatedReset; stop/terminate carry note).
P2 hardening: process_start env maxProperties 256, audit filter bounds,
expected_mtime documented dual-format, feedback related_job_id pattern +
related_request_id bound, process_list managed status enum
(starting|running|completed|failed|expired, code-derived).

## 5.10.7 — 2026-09-09

PATCH, 51 tools. From-scratch audit thaw #2 (schemas follow verified
runtime + agent truth, no agent changes needed):
remoteMutation family (file_write, file_move, file_delete,
directory_create) outputs wrapped to {status,tool,client_id,job_id,
duration_ms,result,error,retryable} with typed result payloads from
mutation-ops truth (write->{path,mode,bytes_written,previous_sha256,
expected_sha256,sha256}; move->{source,destination,overwritten};
delete->{path,deleted,recursive,type}; mkdir->{path,created});
file_edit declares tool + duration_ms.

## 5.10.6 — 2026-09-09

PATCH, 51 tools. From-scratch audit thaw (schemas follow verified runtime
truth, no agent changes needed):
process_output output flattened (result wrapper + exited/job_id/duration_ms
never emitted — dropped); log_read output flattened to content +
lines_returned + duration_ms (lines[]/count never emitted — dropped, source
gains the client|mcp-server|mcp-tunnel enum); audit_query entries gain
status/entry_hash/prev_hash/payload (+date-time created_at, top-level
client_id string|null) while the runtime drops the redundant payload_json
copy via explicit projection; browser_navigate downloads items typed
(filename/path/size_bytes/completed|too_large|blocked_policy|failed);
process_start declares tool + duration_ms.

## 5.10.5 — 2026-09-09

PATCH, 51 tools. Final P2 polish, no new tools, contract freezes after this:
service start/stop/restart (+status) unit descriptions drop the stale
unit/service migration sentence; service start/stop/restart output renames
`service` to `unit` for input/output symmetry (runtime emits the resolved
unit); system_snapshot loadavg pinned to exactly 3 items; ISO-8601
`format: date-time` on last_seen/created_at/finished_at/mtime/expires_at/
started_at (process_start.started_at also corrected to string|null).

## 5.10.4 — 2026-09-09

PATCH, 51 tools, no wire changes (schemas now describe the runtime truth):
`log_follow_read` + `process_output` `client_id` is `string|null`
(handle-based tools never echo a host id); `nc_feedback` gains the closed
`completed|failed` status enum; `process_input.data` maxLength corrected to
65536 (central enforces INVALID_DATA above 64 KiB per call).

## 5.10.3 — 2026-09-09

PATCH, 51 tools, no wire changes: final three top-level `status` fields
gain the `completed|failed` enum (`file_stat`, `job_get`, `job_cancel`);
all 51 tool output envelopes now carry a closed status enum. Browser
`target` refs were already bounded at 1024 chars.

## 5.10.2 — 2026-09-09

PATCH, 51 tools, no wire changes: service start/stop/restart `required`
follows canonical `unit` (the `service` fallback stays runtime-accepted
but is no longer advertised as required).


## 5.10.1 — 2026-09-09

PATCH, 51 tools, no wire changes: documents win32 process_list rows
(pid+name only), keeping the schema honest per platform.


## 5.10.0 — 2026-09-09

MINOR, 51 tools, backward compatible: new `job_get` (poll job lifecycle state)
and `job_cancel` (best-effort advisory cancel) close the async-handle loop;
`service_start/stop/restart` accept `unit` as preferred alias for `service`.
Plus PATCH-grade corrections: process_list documents its real flat dual-scope
shape; system_snapshot gains release/loadavg; client_list top-level client_id
nullable; 30 envelope statuses narrowed to completed|failed; file_stat
wording; enforced input bounds; pid/exit_code nullability; service naming
cross-references.

## 5.9.1 — 2026-09-09

PATCH, 49 tools, backward compatible (no wire changes; schemas now describe
the runtime truth): client_list items use the real inventory fields
(client_id, hostname, client_version, status, transport, capabilities);
file_read_many, directory_tree, process_list, browser_find, browser_tabs,
browser_console_messages, browser_network_requests, browser_file_upload
results are typed (no generic object[]) and nested under result like the
wire; audit_query entries are typed audit rows; file_read documents
bytes/truncated; file_edit gains the enforced 64-hex sha pattern;
process_start/shell bounds mirror runtime enforcement; service unit/service
naming cross-referenced; pid/exit_code nullability matches runtime.

## 5.9.0 — 2026-09-08

MINOR, 49 tools, backward compatible: new `gui_close` tool closes a GUI
application previously launched via `gui_launch`, by its reported process
id. Only agent-launched PIDs are accepted (GUI_PID_NOT_MANAGED otherwise),
so no new privilege is introduced. No renames, removals, or required-field
changes.


## 5.8.3 — 2026-09-08

PATCH, 48 tools: audit_query documents the action vocabulary (tool calls
are recorded under action "tool.execute" with the tool name in
payload.tool).


## 5.8.2 — 2026-09-08

PATCH, 48 tools, no renames/removals/required changes:
- shell_exec documents the platform shell contract (cmd.exe /d /s /c on
  Windows, /bin/bash -lc elsewhere).
- service_list records carry `queryable` (service_status policy allowlist
  discoverability).


## 5.8.1 — 2026-09-08

Canonical tool metadata (PATCH, 48 tools, no semantic changes): human-readable
titles across the surface (e.g. Remote Shell → Run Shell Command, Browser
Snapshot → Inspect Web Page); tool-selection disambiguation signals
(dedicated-tool-first pointers, overlap pairs: uninstall/forget,
write/edit, list/tree, log snapshot/follow, restart/stop); descriptions for
all 187 input properties; annotation corrections (client_uninstall and
file_edit are destructive; pure reads are idempotent); unenforced
"confirmation required" claim on privileged_shell_exec softened to
recommended (confirm=true + mcp:admin remain enforced where implemented).

## 5.3.0 — 2026-09-07

New tool `nc_feedback` (42 total): structured product-issue reporting with server-side enrichment,
secret redaction, deterministic fingerprint dedup and severity computation. All annotations false
(internal sink); outputSchema-validated structured result.

## 5.2.0 — 2026-09-07

20 new tools (41 total): client_ping/uninstall, file_read_many/edit/stat, directory_tree,
process_start/output/input/list/terminate (opaque handles, no shell strings), service_list/start/stop/restart,
log_follow_start/read/stop, browser_create/close (+optional browser_id), audit_query.
All tools carry annotations + rich property descriptions; client_id mirrors x-mcp-header Client-Id.
Deterministic categorical ordering for prompt-cache stability. shell_exec is now documented fallback.

## 2026-09-07 — Initial public release

Extracted from the private monorepo canonical sources. Agent protocol
`1.0.0`, MCP contract `5.1.0` (20 tools), host-policy contract `1.0.0`
(18 capabilities). Clean root commit; prior history intentionally omitted.
