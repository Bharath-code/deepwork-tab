import { verifyLicense } from '../lib/entitlement.js';

const $ = (id) => document.getElementById(id);

async function paint() {
  const { pro, proEmail } = await chrome.storage.local.get(['pro', 'proEmail']);
  $('licenseState').textContent = pro ? `Activated — ${proEmail}` : 'Not activated.';
  $('licenseKey').hidden = !!pro;
  $('licenseBtn').hidden = !!pro;
}

$('licenseBtn').addEventListener('click', async () => {
  const { valid, email } = await verifyLicense($('licenseKey').value.trim());
  if (!valid) {
    $('licenseMsg').textContent = "That key didn't verify. Check for a missing character.";
    return;
  }
  await chrome.storage.local.set({ pro: true, proEmail: email });
  $('licenseKey').value = '';
  $('licenseMsg').textContent = 'Activated. Pro features are on.';
  paint();
});

paint();
