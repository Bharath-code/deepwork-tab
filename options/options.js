const $ = (id) => document.getElementById(id);
const GATE_SECONDS = 60;
let current = {};
let countdown = null;

async function load() {
  current = await chrome.storage.local.get({ cap: 7, enabled: true, reason: '' });
  $('reason').value = current.reason;
  $('cap').value = current.cap;
  $('enabled').checked = current.enabled;
}

function needsGate(next) {
  return next.cap > current.cap || (!next.enabled && current.enabled);
}

async function apply(next) {
  await chrome.storage.local.set(next);
  current = next;
  $('status').textContent = 'Saved.';
  setTimeout(() => ($('status').textContent = ''), 2000);
}

$('saveBtn').addEventListener('click', () => {
  const next = {
    reason: $('reason').value.trim(),
    cap: Math.max(1, Math.min(50, parseInt($('cap').value, 10) || 7)),
    enabled: $('enabled').checked
  };
  if (!needsGate(next)) {
    apply(next);
    return;
  }
  openGate(next);
});

function openGate(next) {
  $('gateReason').textContent = current.reason
    ? `"${current.reason}"`
    : '(you never wrote a reason — that itself is worth a minute)';
  $('gate').hidden = false;
  $('cancelBtn').focus();
  let left = GATE_SECONDS;
  $('timer').textContent = left;
  $('announce').textContent = `${left} seconds until the change applies`;
  countdown = setInterval(async () => {
    left -= 1;
    $('timer').textContent = left;
    if (left === 30 || left === 10) {
      $('announce').textContent = `${left} seconds until the change applies`;
    }
    if (left <= 0) {
      clearInterval(countdown);
      $('gate').hidden = true;
      $('announce').textContent = 'Change applied';
      await apply(next);
    }
  }, 1000);
}

$('cancelBtn').addEventListener('click', () => {
  clearInterval(countdown);
  $('gate').hidden = true;
  $('announce').textContent = 'Cancelled. Your limit is unchanged.';
  load();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('gate').hidden) $('cancelBtn').click();
});

load();
