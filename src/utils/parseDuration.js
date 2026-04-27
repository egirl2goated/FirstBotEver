const UNITS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

function parseDuration(input) {
  if (!input || typeof input !== 'string') return null;
  const matches = input.trim().toLowerCase().match(/(\d+)\s*([smhdw])/g);
  if (!matches) return null;
  let total = 0;
  for (const m of matches) {
    const [, n, unit] = m.match(/(\d+)\s*([smhdw])/);
    total += parseInt(n, 10) * UNITS[unit];
  }
  return total > 0 ? total : null;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  const parts = [];
  const order = [
    ['d', UNITS.d],
    ['h', UNITS.h],
    ['m', UNITS.m],
    ['s', UNITS.s],
  ];
  let remaining = ms;
  for (const [label, size] of order) {
    const value = Math.floor(remaining / size);
    if (value > 0) {
      parts.push(`${value}${label}`);
      remaining -= value * size;
    }
  }
  return parts.join(' ') || `${ms}ms`;
}

module.exports = { parseDuration, formatDuration };