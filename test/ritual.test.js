import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayOf, cleanThing, oneThingDue, nextShutdownAt, shutdownDue, laterAllowed, shelfGroup, dayLine, GRACE_MS, LATER_MS } from '../lib/ritual.js';

const sched = { on: true, days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' };
const at = (day, h, m = 0) => new Date(2026, 9, day, h, m).getTime();
const on = { oneThing: true, shutdown: true };

test('cleanThing collapses whitespace and caps at 140', () => {
  assert.equal(cleanThing('  ship   the\n migration '), 'ship the migration');
  assert.equal(cleanThing('x'.repeat(200)).length, 140);
  assert.equal(cleanThing(null), '');
});

test('One Thing is due once per work day, only when enabled', () => {
  const base = { rituals: on, ritual: {}, schedule: sched, now: at(12, 9, 5) };
  assert.equal(oneThingDue(base), true);
  assert.equal(oneThingDue({ ...base, ritual: { oneThingAsked: dayOf(new Date(base.now)) } }), false);
  assert.equal(oneThingDue({ ...base, rituals: { oneThing: false } }), false);
  assert.equal(oneThingDue({ ...base, now: at(12, 8, 55) }), false);
  assert.equal(oneThingDue({ ...base, now: at(17, 10) }), false);
  assert.equal(oneThingDue({ ...base, schedule: { ...sched, on: false } }), true);
});

test('08:55 open prompts on the first tab after 09:00', () => {
  const base = { rituals: on, ritual: {}, schedule: sched };
  assert.equal(oneThingDue({ ...base, now: at(12, 8, 55) }), false);
  assert.equal(oneThingDue({ ...base, now: at(12, 9, 1) }), true);
});

test('next shutdown skips the weekend and passed ends', () => {
  assert.equal(nextShutdownAt(sched, at(12, 10)), at(12, 18));
  assert.equal(nextShutdownAt(sched, at(12, 18, 1)), at(13, 18));
  assert.equal(nextShutdownAt(sched, at(16, 19)), at(19, 18));
  assert.equal(nextShutdownAt({ ...sched, on: false }, at(12, 10)), null);
  assert.equal(nextShutdownAt({ ...sched, start: '22:00', end: '02:00' }, at(12, 10)), null);
});

test('shutdown shows inside the 2h grace window, once', () => {
  const base = { rituals: on, ritual: {}, schedule: sched };
  assert.equal(shutdownDue({ ...base, now: at(12, 17, 59) }), false);
  assert.equal(shutdownDue({ ...base, now: at(12, 18) }), true);
  assert.equal(shutdownDue({ ...base, now: at(12, 18) + GRACE_MS }), true);
  assert.equal(shutdownDue({ ...base, now: at(12, 18) + GRACE_MS + 60000 }), false);
  assert.equal(shutdownDue({ ...base, ritual: { shutdownShown: '2026-10-12' }, now: at(12, 18, 5) }), false);
  assert.equal(shutdownDue({ ...base, rituals: { shutdown: false }, now: at(12, 18, 5) }), false);
  assert.equal(shutdownDue({ ...base, now: at(17, 18, 5) }), false);
});

test('Later hides shutdown for 30 minutes and is allowed once a day', () => {
  const now = at(12, 18, 10);
  const ritual = { laterDay: '2026-10-12', laterUntil: now + LATER_MS };
  const base = { rituals: on, ritual, schedule: sched };
  assert.equal(shutdownDue({ ...base, now: now + 60000 }), false);
  assert.equal(shutdownDue({ ...base, now: now + LATER_MS + 1 }), true);
  assert.equal(laterAllowed(ritual, now), false);
  assert.equal(laterAllowed({ laterDay: '2026-10-11' }, now), true);
});

test('shelf group label and day line', () => {
  assert.equal(shelfGroup(6, at(11, 18)), 'Oct 11 · 6 tabs');
  assert.equal(shelfGroup(1, at(11, 18)), 'Oct 11 · 1 tab');
  const now = at(12, 18);
  const weekLog = [
    { type: 'intercept', ts: at(12, 10) },
    { type: 'intercept', ts: at(12, 11) },
    { type: 'intercept', ts: at(11, 11) },
    { type: 'queue', ts: at(12, 11) }
  ];
  assert.equal(dayLine({ weekLog, oneThing: { day: '2026-10-12', done: true }, now }), '2 intercepts held · 1 thing finished');
  assert.equal(dayLine({ weekLog: [], oneThing: { day: '2026-10-11', done: true }, now }), 'A quiet day.');
});

test('finishThing records the day once and caps history', async () => {
  const { finishThing, thingsDoneThisWeek, dayOf } = await import('../lib/ritual.js');
  const a = finishThing({ day: '2026-10-12', text: 'x' }, ['2026-10-11']);
  assert.equal(a.oneThing.done, true);
  assert.deepEqual(a.doneDays, ['2026-10-11', '2026-10-12']);
  assert.deepEqual(finishThing({ day: '2026-10-12' }, a.doneDays).doneDays, a.doneDays);
  const now = Date.parse('2026-10-12T12:00:00');
  assert.equal(thingsDoneThisWeek(['2026-10-01', '2026-10-07', '2026-10-12'], now), 2);
  assert.ok(dayOf);
});
