export function wrapFocus(nodes, active, shift) {
  if (!nodes.length) return null;
  const i = nodes.indexOf(active);
  if (shift) return i <= 0 ? nodes[nodes.length - 1] : nodes[i - 1];
  if (i === -1 || i === nodes.length - 1) return nodes[0];
  return nodes[i + 1];
}
