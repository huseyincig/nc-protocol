// One-shot: extend nc-protocol to contract 5.2.0 (new tools + annotations).
// Run: node gen-52.mjs. Then commit + push the protocol repo.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CID = {
  type: 'string',
  pattern: '^nc_[0-9a-f]{64}$',
  minLength: 68,
  maxLength: 68,
  description: 'Target NC client. Absolute routing handle, independent of any connection.',
  'x-mcp-header': 'Client-Id'
};
const PID = {
  type: 'string',
  pattern: '^prc_[0-9a-f]{32}$',
  description: 'Opaque process handle returned by process_start. 128-bit entropy, never parsed.'
};
const BID = {
  type: 'string',
  pattern: '^brw_[0-9a-f]{32}$',
  description: 'Opaque browser context handle returned by browser_create.'
};
const LH = {
  type: 'string',
  pattern: '^log_[0-9a-f]{32}$',
  description: 'Opaque log-follow handle returned by log_follow_start.'
};
const ann = (readOnlyHint, destructiveHint, idempotentHint, openWorldHint) => ({
  readOnlyHint,
  destructiveHint,
  idempotentHint,
  openWorldHint
});
const obj = (properties, required = []) => ({
  type: 'object',
  additionalProperties: false,
  ...(required.length ? { required } : {}),
  properties
});
const out = (properties) => ({ type: 'object', properties });

const NT = [];
const T = (
  name,
  title,
  description,
  inputSchema,
  outputSchema,
  annotations,
  extra = {}
) => NT.push({ name, title, description, inputSchema, outputSchema, annotations, ...extra });

// ---- client ----
T('client_ping', 'Ping Client', 'Checks whether the selected NC client is reachable through the hub and reports session freshness. Read-only; never executes anything on the host.',
  obj({ client_id: CID }, ['client_id']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, reachable: { type: 'boolean' }, online: { type: 'boolean' }, last_seen_age_ms: { type: ['integer', 'null'] }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('client_uninstall', 'Uninstall Client', 'Removes the NC agent from the selected client: stops services/daemons and deletes the runtime. Destructive and irreversible; requires explicit confirm=true and admin scope. Supported where the platform helper exists (Linux today).',
  obj({ client_id: CID, confirm: { type: 'boolean', const: true, description: 'Explicit destructive-action confirmation.' } }, ['client_id', 'confirm']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, error: { type: 'string' } }),
  ann(false, true, false, false));
// ---- files ----
T('file_read_many', 'Read Many Files', 'Reads up to 10 files in one call. More efficient than repeated file_read; prefer it for multi-file review.',
  obj({ client_id: CID, paths: { type: 'array', items: { type: 'string', maxLength: 4096 }, minItems: 1, maxItems: 10, description: 'Absolute paths on the selected client.' }, max_bytes: { type: 'integer', minimum: 1, maximum: 65536, default: 65536, description: 'Per-file byte cap.' } }, ['client_id', 'paths']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, results: { type: 'array', items: { type: 'object' } }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('file_edit', 'Surgical File Edit', 'Replaces exactly one occurrence of expected_text with replacement_text. Fails closed when the expectation does not match exactly once, or when expected_sha256/expected_mtime show the file changed underneath (optimistic concurrency). Prefer over read-modify-write cycles.',
  obj({ client_id: CID, path: { type: 'string', maxLength: 4096, description: 'Absolute path of the file on the selected client.' }, expected_text: { type: 'string', description: 'Exact current block; must occur exactly once.' }, replacement_text: { type: 'string', description: 'Replacement block.' }, expected_sha256: { type: 'string', description: 'Optional optimistic-concurrency guard (hex sha256 of current content).' }, expected_mtime: { type: 'string', description: 'Optional optimistic-concurrency guard (mtime).' } }, ['client_id', 'path', 'expected_text', 'replacement_text']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, path: { type: 'string' }, error: { type: 'string' } }),
  ann(false, true, false, false));
T('file_stat', 'File Metadata', 'Returns size, timestamps and mode for a path without reading content. Use before edits or transfers.',
  obj({ client_id: CID, path: { type: 'string', maxLength: 4096, description: 'Absolute path on the selected client.' } }, ['client_id', 'path']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, path: { type: 'string' }, size_bytes: { type: ['integer', 'null'] }, mtime: { type: ['string', 'null'] }, mode: { type: ['string', 'null'] }, is_directory: { type: 'boolean' }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('directory_tree', 'Directory Tree', 'Recursive directory listing with depth and entry caps. Prefer over repeated file_list calls.',
  obj({ client_id: CID, path: { type: 'string', maxLength: 4096, description: 'Absolute root path on the selected client.' }, max_depth: { type: 'integer', minimum: 1, maximum: 10, default: 5 }, max_entries: { type: 'integer', minimum: 1, maximum: 2000, default: 500 } }, ['client_id', 'path']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, path: { type: 'string' }, entries: { type: 'array', items: { type: 'object' } }, truncated: { type: 'boolean' }, error: { type: 'string' } }),
  ann(true, false, true, false));
// ---- process ----
T('process_start', 'Start Process', 'Spawns a process WITHOUT a shell: executable plus argv array (no shell parsing, no quoting, smaller injection surface). Returns an opaque process_id handle; the MCP connection may close while the process runs. Use shell_exec only when real shell features (pipes, globs) are required.',
  obj({ client_id: CID, executable: { type: 'string', description: 'Binary to execute (no shell metacharacters interpreted).' }, args: { type: 'array', items: { type: 'string' }, default: [], description: 'Argument vector, passed verbatim.' }, cwd: { type: 'string', description: 'Absolute working directory.' }, env: { type: 'object', additionalProperties: { type: 'string' }, description: 'Extra environment variables.' }, pty: { type: 'boolean', default: false, description: 'Request a PTY (v1: accepted, pipes used, noted in result).' }, timeout_seconds: { type: 'integer', minimum: 1, maximum: 3600, default: 300 }, idle_timeout_seconds: { type: 'integer', minimum: 30, maximum: 3600, default: 600, description: 'Session reaped after this long without reads.' } }, ['client_id', 'executable']),
  out({ status: { type: 'string' }, process_id: { type: 'string' }, client_id: { type: 'string' }, pid: { type: ['integer', 'null'] }, started_at: { type: 'string' }, stdout_cursor: { type: 'integer' }, stderr_cursor: { type: 'integer' }, error: { type: 'string' } }),
  ann(false, false, false, false));
T('process_output', 'Read Process Output', 'Reads buffered stdout/stderr from a process handle using cursors, so callers never re-fetch the whole log. Pass back the cursors from the previous call.',
  obj({ process_id: PID, stdout_cursor: { type: 'integer', minimum: 0, default: 0 }, stderr_cursor: { type: 'integer', minimum: 0, default: 0 }, max_bytes: { type: 'integer', minimum: 1, maximum: 262144, default: 65536 }, wait_ms: { type: 'integer', minimum: 0, maximum: 30000, default: 0, description: 'Long-poll for new output up to this long.' } }, ['process_id']),
  out({ status: { type: 'string', enum: ['running', 'completed', 'failed', 'unknown_handle'] }, stdout: { type: 'string' }, stderr: { type: 'string' }, stdout_cursor: { type: 'integer' }, stderr_cursor: { type: 'integer' }, exit_code: { type: ['integer', 'null'] }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('process_input', 'Send Process Input', 'Writes data to a running process stdin (REPLs, installers, confirmation prompts).',
  obj({ process_id: PID, data: { type: 'string', description: 'Bytes appended to stdin.' } }, ['process_id', 'data']),
  out({ status: { type: 'string' }, error: { type: 'string' } }),
  ann(false, false, false, false));
T('process_list', 'List Processes', 'Lists process sessions. scope managed shows NC-tracked sessions; scope system shows OS processes.',
  obj({ client_id: { ...CID, description: 'Target client (required for system scope).' }, scope: { type: 'string', enum: ['managed', 'system'], default: 'managed' } }, []),
  out({ status: { type: 'string' }, scope: { type: 'string' }, processes: { type: 'array', items: { type: 'object' } }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('process_terminate', 'Terminate Process', 'Graceful SIGTERM first; force=true escalates to hard kill. High-risk on system PIDs: prefer managed handles.',
  obj({ process_id: PID, force: { type: 'boolean', default: false } }, ['process_id']),
  out({ status: { type: 'string' }, error: { type: 'string' } }),
  ann(false, true, false, false));
// ---- services ----
T('service_list', 'List Services', 'Lists services known to the selected client (systemd/SCM/launchd abstracted).',
  obj({ client_id: CID }, ['client_id']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, services: { type: 'array', items: { type: 'object' } }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('service_start', 'Start Service', 'Starts a service by name through the platform service manager.',
  obj({ client_id: CID, service: { type: 'string', description: 'Service/unit name.' } }, ['client_id', 'service']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, service: { type: 'string' }, error: { type: 'string' } }),
  ann(false, false, false, false));
T('service_stop', 'Stop Service', 'Stops a service by name. Disruptive: confirm intent before calling.',
  obj({ client_id: CID, service: { type: 'string', description: 'Service/unit name.' } }, ['client_id', 'service']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, service: { type: 'string' }, error: { type: 'string' } }),
  ann(false, true, false, false));
T('service_restart', 'Restart Service', 'Restarts a service by name (stop + start). Disruptive: confirm intent before calling.',
  obj({ client_id: CID, service: { type: 'string', description: 'Service/unit name.' } }, ['client_id', 'service']),
  out({ status: { type: 'string' }, client_id: { type: 'string' }, service: { type: 'string' }, error: { type: 'string' } }),
  ann(false, true, false, false));
// ---- log follow ----
T('log_follow_start', 'Start Log Follow', 'Opens a stateful tail handle on a client log file; read incrementally with log_follow_read. Prefer over repeated log_read polling.',
  obj({ client_id: CID, source: { type: 'string', description: 'Log source (client log files in v1).' }, path: { type: 'string', description: 'Explicit log file path (optional).' }, max_lines: { type: 'integer', minimum: 1, maximum: 1000, default: 200 } }, ['client_id', 'source']),
  out({ status: { type: 'string' }, handle: { type: 'string' }, content: { type: 'string' }, cursor: { type: 'integer' }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('log_follow_read', 'Read Followed Log', 'Returns log bytes appended since cursor.',
  obj({ handle: LH, cursor: { type: 'integer', minimum: 0, default: 0 }, max_bytes: { type: 'integer', minimum: 1, maximum: 262144, default: 65536 } }, ['handle']),
  out({ status: { type: 'string' }, content: { type: 'string' }, cursor: { type: 'integer' }, eof: { type: 'boolean' }, error: { type: 'string' } }),
  ann(true, false, true, false));
T('log_follow_stop', 'Stop Log Follow', 'Closes a log-follow handle and releases its state.',
  obj({ handle: LH }, ['handle']),
  out({ status: { type: 'string' }, error: { type: 'string' } }),
  ann(true, false, true, false));
// ---- browser ----
T('browser_create', 'Create Browser Context', 'Creates an isolated browser context on the client and returns a browser_id handle, so concurrent agents never share state. Pass the handle to navigate/interact/snapshot; omit it to use the default context.',
  obj({ client_id: CID }, ['client_id']),
  out({ status: { type: 'string' }, browser_id: { type: 'string' }, client_id: { type: 'string' }, error: { type: 'string' } }),
  ann(false, false, false, false));
T('browser_close', 'Close Browser Context', 'Closes a browser context created by browser_create and releases its state.',
  obj({ browser_id: BID }, ['browser_id']),
  out({ status: { type: 'string' }, error: { type: 'string' } }),
  ann(false, false, true, false));
// ---- audit ----
T('audit_query', 'Query Audit Trail', 'Reads the caller tenant audit trail with filters. Read-only introspection over the platform audit chain.',
  obj({ action: { type: 'string', description: 'Filter by action name.' }, actor: { type: 'string', description: 'Filter by actor id/email.' }, status: { type: 'string', description: 'Filter by record status.' }, limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 }, offset: { type: 'integer', minimum: 0, default: 0 } }, []),
  out({ status: { type: 'string' }, entries: { type: 'array', items: { type: 'object' } }, total: { type: 'integer' }, error: { type: 'string' } }),
  ann(true, false, true, false));

const dir = path.join(HERE, 'mcp/tools');
for (const t of NT) {
  fs.writeFileSync(path.join(dir, `${t.name}.json`), JSON.stringify(t, null, 2) + '\n');
  console.log('wrote', t.name);
}
