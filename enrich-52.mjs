// One-shot: enrich existing 20 tools (annotations, x-mcp-header, descriptions),
// rebuild canonical index, bump to 5.2.0. Run after gen-52.mjs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(HERE, 'mcp/tools');
const read = (n) => JSON.parse(fs.readFileSync(path.join(dir, `${n}.json`), 'utf8'));
const write = (n, v) => fs.writeFileSync(path.join(dir, `${n}.json`), JSON.stringify(v, null, 2) + '\n');

const ann = (readOnlyHint, destructiveHint, idempotentHint, openWorldHint) => ({
  readOnlyHint,
  destructiveHint,
  idempotentHint,
  openWorldHint
});
const ANN = {
  shell_exec: ann(false, true, false, false),
  privileged_shell_exec: ann(false, true, false, false),
  client_update: ann(false, false, false, false),
  client_list: ann(true, false, true, false),
  client_enroll: ann(false, false, false, false),
  client_forget: ann(false, true, false, false),
  log_read: ann(true, false, true, false),
  file_read: ann(true, false, true, false),
  file_list: ann(true, false, true, false),
  file_search: ann(true, false, true, false),
  service_status: ann(true, false, true, false),
  system_snapshot: ann(true, false, true, false),
  gui_launch: ann(false, false, false, false),
  browser_navigate: ann(false, false, false, true),
  browser_interact: ann(false, false, false, true),
  browser_snapshot: ann(true, false, true, true),
  file_write: ann(false, true, false, false),
  directory_create: ann(false, false, true, false),
  file_move: ann(false, true, false, false),
  file_delete: ann(false, true, true, false)
};
const BID_PROP = {
  type: 'string',
  pattern: '^brw_[0-9a-f]{32}$',
  description: 'Browser context handle from browser_create. Omit to use the default context.'
};
const ORDER = [
  'client_list', 'client_ping', 'client_enroll', 'client_update', 'client_uninstall',
  'client_forget', 'system_snapshot', 'file_read', 'file_read_many', 'file_write',
  'file_edit', 'file_stat', 'file_list', 'directory_tree', 'directory_create',
  'file_move', 'file_delete', 'file_search', 'process_start', 'process_output',
  'process_input', 'process_list', 'process_terminate', 'service_list', 'service_status',
  'service_start', 'service_stop', 'service_restart', 'log_read', 'log_follow_start',
  'log_follow_read', 'log_follow_stop', 'browser_create', 'browser_navigate',
  'browser_interact', 'browser_snapshot', 'browser_close', 'audit_query', 'gui_launch',
  'shell_exec', 'privileged_shell_exec'
];

for (const name of ORDER) {
  const t = read(name);
  t.annotations = ANN[name] || ann(false, false, false, false);
  const props = t.inputSchema?.properties || {};
  if (props.client_id && typeof props.client_id === 'object') {
    if (!props.client_id.description)
      props.client_id.description =
        'Target NC client. Absolute routing handle, independent of any connection.';
    props.client_id['x-mcp-header'] = 'Client-Id';
  }
  if (name === 'shell_exec') {
    t.description =
      'Execute a shell command on the selected NC client. Fallback tool: prefer dedicated NC filesystem, process, service, log, browser and system tools whenever they can perform the requested operation. client_id and command are mandatory; commands run bounded with timeouts and truncated output.';
  }
  if (['browser_navigate', 'browser_interact', 'browser_snapshot'].includes(name)) {
    props.browser_id = { ...BID_PROP };
  }
  write(name, t);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
}
const all = ORDER.map(read);
const fp = 'sha256:' + crypto.createHash('sha256').update(canonicalJson(all)).digest('hex');
fs.writeFileSync(path.join(HERE, 'mcp/contract-version'), '5.2.0\n');
fs.writeFileSync(path.join(HERE, 'mcp/fingerprint'), fp + '\n');
fs.writeFileSync(
  path.join(dir, 'index.json'),
  JSON.stringify({ contract_version: '5.2.0', fingerprint: fp, tools: ORDER }, null, 2) + '\n'
);
console.log(JSON.stringify({ tools: ORDER.length, fingerprint: fp }));
