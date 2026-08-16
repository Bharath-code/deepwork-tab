import { verifyLicense } from '../lib/entitlement.js';
import { sessionState, formatRemaining } from '../lib/session.js';

const $ = (id) => document.getElementById(id);

async function paint() {
  const { pro, proEmail } = await chrome.storage.local.get(['pro', 'proEmail']);
  $('licenseState').textContent = pro ? `Activated — ${proEmail}` : 'Not activated.';
  $('licenseKey').hidden = !!pro;
  $('licenseBtn').hidden = !!pro;
  paintSession();
}

async function paintSession() {
  const { pro, session = null } = await chrome.storage.local.get(['pro', 'session']);
  $('sessionBox').hidden = !pro;
  if (!pro) return;
  const { active, remainingMs } = sessionState(session);
  $('sessionState').textContent = active
    ? `Running — cap ${session.cap}, ${formatRemaining(remainingMs)} left. It cannot be ended early.`
    : 'No session running.';
  $('sessionBtn').disabled = active;
}

$('licenseBtn').addEventListener('click', async () => {
  $('licenseBtn').disabled = true;
  try {
    const { valid, email } = await verifyLicense($('licenseKey').value.trim());
    if (!valid) {
      $('licenseMsg').textContent = "That key didn't verify. Check for a missing character.";
      return;
    }
    try {
      await chrome.storage.local.set({ pro: true, proEmail: email });
    } catch {
      $('licenseMsg').textContent = "Couldn't save the license. Try again.";
      return;
    }
    $('licenseKey').value = '';
    $('licenseMsg').textContent = 'Activated. Pro features are on.';
    paint();
  } finally {
    $('licenseBtn').disabled = false;
  }
});

$('sessionBtn').addEventListener('click', async () => {
  const cap = Math.max(1, Math.min(20, parseInt($('sessionCap').value, 10) || 3));
  const mins = Math.max(5, Math.min(240, parseInt($('sessionMins').value, 10) || 50));
  await chrome.storage.local.set({ session: { cap, endsAt: Date.now() + mins * 60000 } });
  paintSession();
});

paint();
setInterval(paintSession, 30000);
