const GAP = 4;

export function lens(count, cap) {
  const n = Math.max(1, Math.floor(cap));
  const full = count >= n;
  const step = 360 / n;
  const gap = full ? 0 : GAP;
  const segments = Array.from({ length: n }, (_, i) => ({
    from: i * step + gap / 2,
    to: (i + 1) * step - gap / 2,
    on: i < count
  }));
  return { segments, full, over: Math.max(0, count - n), label: `${count} of ${n} tabs open` };
}

const point = (c, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return `${(c + r * Math.sin(a)).toFixed(3)} ${(c - r * Math.cos(a)).toFixed(3)}`;
};

export function arcPath(c, r, from, to) {
  return `M${point(c, r, from)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${point(c, r, to)}`;
}

export function lensSvg(count, cap, size = 34, stroke = 3, time = null) {
  const { segments, full, over, label } = lens(count, cap);
  const c = size / 2;
  const r = c - stroke / 2 - 1 - (time === null ? 0 : 3);
  const ring = full
    ? `<circle cx="${c}" cy="${c}" r="${r}" class="lens-on"/>`
    : segments.map((s, i) => `<path d="${arcPath(c, r, s.from, s.to)}" class="${s.on ? 'lens-on' : i === count ? 'lens-off lens-next' : 'lens-off'}"/>`).join('');
  const t = Math.min(1, Math.max(0, time ?? 0));
  const timeArc = t > 0 ? `<path d="${arcPath(c, c - 1, 0, t * 359.999)}" class="lens-time"/>` : '';
  const notch = over
    ? `<path d="${arcPath(c, r, 360 - Math.min(over, segments.length) * (360 / segments.length), 359.999)}" class="lens-over"/>`
    : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}" class="lens" style="--lens-w:${stroke}px">`
    + `${ring}${notch}${timeArc}<circle cx="${c}" cy="${c}" r="${(size / 10).toFixed(2)}" class="lens-dot"/></svg>`;
}

export function capState(count, cap) {
  return count > cap ? 'over' : count === cap ? 'at' : count === cap - 1 ? 'near' : 'calm';
}
