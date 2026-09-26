import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));

test('no install-time host access beyond the ping worker', () => {
  // Static content_scripts matches add an install warning; YouTube is registered after the optional grant.
  assert.equal(manifest.content_scripts, undefined);
  assert.deepEqual(manifest.host_permissions, ['https://deepwork-tab-ping.kumarbharath63.workers.dev/*']);
  assert.ok(manifest.optional_host_permissions.includes('*://www.youtube.com/*'));
  assert.ok(manifest.permissions.includes('scripting'));
});
