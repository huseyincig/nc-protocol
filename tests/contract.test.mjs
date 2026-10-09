import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));

test('namespaces and required files exist', () => {
  for (const f of [
    'agent/hello.schema.json',
    'agent/welcome.schema.json',
    'agent/request.schema.json',
    'agent/reply.schema.json',
    'agent/heartbeat.schema.json',
    'agent/capabilities.schema.json',
    'agent/errors.schema.json',
    'mcp/contract-version',
    'mcp/fingerprint',
    'mcp/tools/index.json',
    'policy/host-policy.schema.json',
    'policy/capability-names',
    'browser/public-policy.schema.json',
    'bindings/javascript/contracts.mjs'
  ])
    assert.ok(fs.existsSync(path.join(ROOT, f)), f);
});

test('tool manifest is exact: 46 tools, pinned fingerprint', () => {
  const index = json('mcp/tools/index.json');
  assert.equal(index.contract_version, read('mcp/contract-version').trim());
  assert.equal(index.fingerprint, read('mcp/fingerprint').trim());
  assert.equal(index.tools.length, 46);
  const files = fs.readdirSync(path.join(ROOT, 'mcp/tools')).filter((f) => f.endsWith('.json') && f !== 'index.json');
  assert.deepEqual([...files.map((f) => f.replace(/\.json$/, ''))].sort(), [...index.tools].sort());
  for (const name of index.tools) {
    const tool = json(`mcp/tools/${name}.json`);
    assert.equal(tool.name, name);
    assert.ok(tool.inputSchema && tool.inputSchema.type === 'object');
  }
});

test('bindings agree with files', async () => {
  const b = await import('../bindings/javascript/contracts.mjs');
  assert.equal(b.MCP_TOOL_CONTRACT_VERSION, read('mcp/contract-version').trim());
  assert.equal(b.MCP_TOOL_MANIFEST_FINGERPRINT, read('mcp/fingerprint').trim());
  assert.deepEqual([...b.MCP_TOOL_NAMES].sort(), [...json('mcp/tools/index.json').tools].sort());
  assert.equal(b.NC_AGENT_PROTOCOL_VERSION, '1.0.0');
  assert.equal(b.HOST_POLICY_CONTRACT_VERSION, '1.0.0');
  assert.equal(b.HOST_POLICY_CAPABILITY_NAMES.length, 22);
});

test('schemas parse and hello requires identity fields', () => {
  const hello = json('agent/hello.schema.json');
  assert.ok(hello.required.includes('client_id'));
  assert.ok(hello.required.includes('protocol_version'));
  const errors = json('agent/errors.schema.json');
  assert.ok(errors.enum.includes('PROTOCOL_INCOMPATIBLE'));
  assert.ok(errors.enum.includes('HOST_POLICY_DENIED'));
});

test('index fingerprint is self-consistent with tool files', async () => {
  const fs = await import('node:fs');
  const crypto = await import('node:crypto');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const index = JSON.parse(fs.readFileSync(path.join(root, 'mcp/tools/index.json'), 'utf8'));
  const tools = index.tools.map((name) => ({
    name,
    ...JSON.parse(fs.readFileSync(path.join(root, `mcp/tools/${name}.json`), 'utf8'))
  }));
  const canonical = JSON.stringify({
    contract_version: index.contract_version,
    tools: tools.map((t) => {
      const annotations = t.annotations
        ? {
            title: t.title,
            ...t.annotations
          }
        : null;
      const meta = t._meta ?? (t.execution != null ? { 'nodecommand.app/execution': t.execution } : {});
      const icons = t.icons ?? [
        {
          src: `https://nodecommand.app/icons/${t.name}.svg`,
          mimeType: 'image/svg+xml',
          sizes: ['any'],
          theme: 'light'
        }
      ];
      return {
        name: t.name,
        title: t.title,
        description: t.description,
        icons,
        inputSchema: t.inputSchema,
        outputSchema: t.outputSchema ?? null,
        annotations,
        _meta: meta
      };
    })
  });
  const fp = 'sha256:' + crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  assert.equal(index.fingerprint, fp);
  assert.equal(fs.readFileSync(path.join(root, 'mcp/fingerprint'), 'utf8').trim(), fp);
});
