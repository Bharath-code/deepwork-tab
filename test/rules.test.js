import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExemptUrl, countedTabs, parseDomains, inWorkHours, rulesLoosen, RULE_DEFAULTS } from '../lib/rules.js';

const at = (day, hh, mm = 0) => new Date(2026, 8, 27 + day, hh, mm); // 2026-09-27 is a Sunday

test('exempt domains match the host and its subdomains, not lookalikes', () => {
  assert.ok(isExemptUrl('https://mail.google.com/x', ['mail.google.com']));
  assert.ok(isExemptUrl('https://app.slack.com', ['slack.com']));
  assert.ok(!isExemptUrl('https://notslack.com', ['slack.com']));
  assert.ok(!isExemptUrl('chrome://newtab', ['slack.com']));
});

test('pinned and exempt tabs do not count; pendingUrl wins over url', () => {
  const tabs = [
    { pinned: true, url: 'https://a.com' },
    { url: 'https://slack.com' },
    { url: 'chrome://newtab', pendingUrl: 'https://slack.com/x' },
    { url: 'https://b.com' }
  ];
  assert.equal(countedTabs(tabs, { exemptPinned: true, exemptDomains: ['slack.com'] }).length, 1);
  assert.equal(countedTabs(tabs, { exemptPinned: false, exemptDomains: [] }).length, 4);
});

test('parseDomains normalises, dedupes, drops junk, caps at 10', () => {
  assert.deepEqual(parseDomains('https://www.Mail.Google.com/inbox\nslack.com, slack.com\nnot a domain\nlocalhost'), [
    'mail.google.com',
    'slack.com'
  ]);
  assert.equal(parseDomains(Array.from({ length: 15 }, (_, i) => `s${i}.com`).join('\n')).length, 10);
});

test('work hours: weekday window, weekend and off-hours', () => {
  const s = { on: true, days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' };
  assert.ok(inWorkHours(s, at(1, 9)));
  assert.ok(!inWorkHours(s, at(1, 18)));
  assert.ok(!inWorkHours(s, at(1, 8, 59)));
  assert.ok(!inWorkHours(s, at(0, 12)));
});

test('overnight window belongs to the day it started', () => {
  const s = { on: true, days: [5], start: '22:00', end: '02:00' };
  assert.ok(inWorkHours(s, at(5, 23)));
  assert.ok(inWorkHours(s, at(6, 1)));
  assert.ok(!inWorkHours(s, at(5, 1)));
});

test('schedule off or broken fails safe to enforcing', () => {
  assert.ok(inWorkHours({ ...RULE_DEFAULTS.schedule, on: false }, at(0, 3)));
  assert.ok(inWorkHours({ on: true, days: [], start: 'x', end: '18:00' }, at(0, 3)));
  assert.ok(inWorkHours(undefined, at(0, 3)));
});

test('loosening needs the gate, tightening does not', () => {
  const base = { ...RULE_DEFAULTS, exemptPinned: false };
  assert.ok(rulesLoosen(base, { ...base, exemptPinned: true }));
  assert.ok(rulesLoosen(base, { ...base, exemptDomains: ['slack.com'] }));
  assert.ok(rulesLoosen(base, { ...base, schedule: { ...base.schedule, on: true } }));
  const on = { ...base, exemptDomains: ['slack.com'], schedule: { ...base.schedule, on: true } };
  assert.ok(!rulesLoosen(on, { ...on, exemptDomains: [] }));
  assert.ok(!rulesLoosen(on, { ...on, schedule: { ...on.schedule, on: false } }));
  assert.ok(!rulesLoosen(on, on));
});
