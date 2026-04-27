const { Events, PermissionsBitField } = require('discord.js');
const config = require('../../config.json');
const { logAction } = require('../utils/logger');
const { addWarning, listWarnings } = require('../utils/warnings');
const { applyThresholdAction } = require('../utils/thresholdActions');

const INVITE_REGEX = /(discord\.gg\/|discord(?:app)?\.com\/invite\/|discord\.com\/invite\/)\S+/i;
const URL_REGEX = /https?:\/\/([^\s/]+)/gi;

const spamCache = new Map();

function isModerator(member) {
  if (!member) return false;
  return member.permissions.has(PermissionsBitField.Flags.ManageMessages);
}

async function handleAntiSpam(message) {
  const cfg = config.automod?.antiSpam;
  if (!cfg?.enabled) return false;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const entry = spamCache.get(key) ?? { times: [] };
  entry.times = entry.times.filter((t) => now - t < cfg.intervalMs);
  entry.times.push(now);
  spamCache.set(key, entry);

  if (entry.times.length >= cfg.messageLimit) {
    spamCache.delete(key);
    const member = await message.guild.members.fetch(message.author.id).catch(() => null);
    if (member?.moderatable) {
      try {
        await member.timeout(cfg.timeoutMs, 'AutoMod: spam detected');
        await message.channel
          .send(`<@${message.author.id}>, you have been timed out for spamming.`)
          .catch(() => null);
        await logAction(message.guild, {
          action: 'automod',
          target: message.author,
          reason: 'Spam detected',
          extra: { Action: 'Timeout', Channel: `<#${message.channel.id}>` },
        });
        return true;
      } catch (err) {
        console.error('Anti-spam timeout failed:', err);
      }
    }
  }
  return false;
}

async function handleAntiInvite(message) {
  const cfg = config.automod?.antiInvite;
  if (!cfg?.enabled) return false;
  if (!INVITE_REGEX.test(message.content)) return false;

  if (cfg.deleteMessage) await message.delete().catch(() => null);
  await message.channel
    .send(`<@${message.author.id}>, server invite links are not allowed here.`)
    .catch(() => null);
  await logAction(message.guild, {
    action: 'automod',
    target: message.author,
    reason: 'Posted server invite link',
    extra: { Channel: `<#${message.channel.id}>` },
  });
  return true;
}

async function handleAntiLink(message) {
  const cfg = config.automod?.antiLink;
  if (!cfg?.enabled) return false;
  const matches = [...message.content.matchAll(URL_REGEX)];
  if (!matches.length) return false;

  const allowed = (cfg.allowedDomains ?? []).map((d) => d.toLowerCase());
  const offending = matches
    .map((m) => m[1].toLowerCase().replace(/^www\./, ''))
    .filter((host) => !allowed.some((a) => host === a || host.endsWith(`.${a}`)));

  if (!offending.length) return false;

  if (cfg.deleteMessage) await message.delete().catch(() => null);
  await message.channel
    .send(`<@${message.author.id}>, links are not allowed here.`)
    .catch(() => null);
  await logAction(message.guild, {
    action: 'automod',
    target: message.author,
    reason: 'Posted disallowed link',
    extra: { Domains: offending.join(', '), Channel: `<#${message.channel.id}>` },
  });
  return true;
}

async function handleBadWords(message) {
  const cfg = config.automod?.badWords;
  if (!cfg?.enabled || !cfg.words?.length) return false;

  const lower = message.content.toLowerCase();
  const hit = cfg.words.find((w) => w && lower.includes(w.toLowerCase()));
  if (!hit) return false;

  if (cfg.deleteMessage) await message.delete().catch(() => null);
  await message.channel
    .send(`<@${message.author.id}>, that word is not allowed here.`)
    .catch(() => null);

  await logAction(message.guild, {
    action: 'automod',
    target: message.author,
    reason: `Bad word: \`${hit}\``,
    extra: { Channel: `<#${message.channel.id}>` },
  });

  if (cfg.warnUser) {
    addWarning(message.guild.id, message.author.id, {
      moderatorId: message.client.user.id,
      reason: `AutoMod: used disallowed word \`${hit}\``,
    });
    const warnings = listWarnings(message.guild.id, message.author.id);
    await applyThresholdAction(message.guild, message.author, warnings.length);
  }
  return true;
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot || message.system) return;
    if (isModerator(message.member)) return;

    try {
      if (await handleBadWords(message)) return;
      if (await handleAntiInvite(message)) return;
      if (await handleAntiLink(message)) return;
      await handleAntiSpam(message);
    } catch (err) {
      console.error('AutoMod error:', err);
    }
  },
};