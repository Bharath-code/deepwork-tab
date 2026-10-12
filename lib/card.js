export const CARD_W = 1200;
export const CARD_H = 630;
export const CARD_HOST = 'deepwork-tab.kumarbharath63.workers.dev';

export function cardModel({ intercepts = 0, queued = 0 } = {}, streakDays = 0, things = 0) {
  if (!intercepts && !queued) return null;
  const n = intercepts || queued;
  const noun = intercepts ? 'held' : 'shelved';
  const lines = [];
  if (intercepts && queued) lines.push(`${queued} shelved for later`);
  if (things) lines.push(`${things} One Thing${things === 1 ? '' : 's'} finished`);
  if (streakDays >= 2) lines.push(`Day ${streakDays} under the cap`);
  return { numeral: String(n), label: `tab${n === 1 ? '' : 's'} ${noun} this week`, lines, host: CARD_HOST };
}

const MARK = [
  [86.452, 23.851, 108.138, 51.045], [109.388, 56.521, 101.648, 90.431], [98.146, 94.823, 66.808, 109.914],
  [61.192, 109.914, 29.854, 94.823], [26.352, 90.431, 18.612, 56.521], [19.862, 51.045, 41.548, 23.851]
];
const GOLD_ARC = [46.609, 21.414, 81.391, 21.414];

function drawMark(ctx, x, y, size) {
  const k = size / 128;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.lineWidth = 14;
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#e8e6e1';
  for (const [x1, y1, x2, y2] of MARK) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.arc(64, 64, 46, Math.atan2(y1 - 64, x1 - 64), Math.atan2(y2 - 64, x2 - 64));
    ctx.stroke();
  }
  ctx.strokeStyle = '#f5c46b';
  ctx.beginPath();
  ctx.arc(64, 64, 46, Math.atan2(GOLD_ARC[1] - 64, GOLD_ARC[0] - 64), Math.atan2(GOLD_ARC[3] - 64, GOLD_ARC[2] - 64));
  ctx.stroke();
  ctx.restore();
}

export function drawCard(ctx, model) {
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  g.addColorStop(0, '#2b3a66');
  g.addColorStop(1, '#4a2f4f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = 'rgba(14, 16, 22, .45)';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = '#f4f2ee';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '200 260px Geist, system-ui, sans-serif';
  ctx.fillText(model.numeral, 80, 330);
  ctx.font = '400 40px Geist, system-ui, sans-serif';
  ctx.fillStyle = '#d7d4cd';
  ctx.fillText(model.label, 88, 395);

  ctx.font = '400 28px "Geist Mono", ui-monospace, monospace';
  ctx.fillStyle = '#f5c46b';
  model.lines.forEach((l, i) => ctx.fillText(l, 88, 450 + i * 40));

  drawMark(ctx, 80, CARD_H - 128, 56);
  ctx.font = '500 26px Geist, system-ui, sans-serif';
  ctx.fillStyle = '#d7d4cd';
  ctx.fillText('DeepWork Tab', 148, CARD_H - 88);
  ctx.textAlign = 'right';
  ctx.font = '400 24px "Geist Mono", ui-monospace, monospace';
  ctx.fillText(model.host, CARD_W - 80, CARD_H - 88);
  ctx.textAlign = 'left';
}

export async function renderCard(model) {
  await document.fonts?.load('200 100px Geist');
  await document.fonts?.load('400 24px "Geist Mono"');
  const canvas = new OffscreenCanvas(CARD_W, CARD_H);
  drawCard(canvas.getContext('2d'), model);
  return canvas.convertToBlob({ type: 'image/png' });
}
