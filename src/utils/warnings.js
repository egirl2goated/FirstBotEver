const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DATA_DIR = path.join(__dirname, '../../data');
const WARNINGS_FILE = path.join(DATA_DIR, 'warnings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadWarnings() {
  ensureDataDir();
  if (!fs.existsSync(WARNINGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(WARNINGS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveWarnings(data) {
  ensureDataDir();
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2));
}

function addWarning(guildId, userId, { moderatorId, reason }) {
  const data = loadWarnings();
  const key = `${guildId}:${userId}`;
  if (!data[key]) data[key] = [];
  data[key].push({
    id: crypto.randomUUID(),
    moderatorId,
    reason,
    createdAt: new Date().toISOString(),
  });
  saveWarnings(data);
}

function listWarnings(guildId, userId) {
  const data = loadWarnings();
  const key = `${guildId}:${userId}`;
  return data[key] ?? [];
}

function removeWarning(guildId, userId, warningId) {
  const data = loadWarnings();
  const key = `${guildId}:${userId}`;
  if (!data[key]) return false;
  const idx = data[key].findIndex((w) => w.id === warningId);
  if (idx === -1) return false;
  data[key].splice(idx, 1);
  if (data[key].length === 0) delete data[key];
  saveWarnings(data);
  return true;
}

function clearWarnings(guildId, userId) {
  const data = loadWarnings();
  const key = `${guildId}:${userId}`;
  const count = data[key]?.length ?? 0;
  delete data[key];
  saveWarnings(data);
  return count;
}

module.exports = { addWarning, listWarnings, removeWarning, clearWarnings };