const CLS = 'dwt-depandora';

function apply(on) {
  document.documentElement.classList.toggle(CLS, on);
}

function killAutoplay() {
  // ponytail: YouTube's autoplay switch has no stable API — click the toggle if
  // it reports as on. Selector will rot; re-check if autoplay starts leaking.
  // Also a no-op if the player hasn't rendered yet — see the `load` listener
  // below, which re-checks once it likely has.
  const t = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
  if (t) t.click();
}

function checkAutoplay() {
  chrome.storage.local.get('pro').then(({ pro }) => {
    if (pro === true) killAutoplay();
  });
}

chrome.storage.local.get('pro').then(({ pro }) => {
  apply(pro === true);
});
checkAutoplay();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.pro) apply(changes.pro.newValue === true);
});

document.addEventListener('yt-navigate-finish', checkAutoplay);
window.addEventListener('load', checkAutoplay);
