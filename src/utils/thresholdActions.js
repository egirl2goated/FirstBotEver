const config = require('../../config.json');
const { logAction } = require('./logger');
const { formatDuration } = require('./parseDuration');

async function applyThresholdAction(guild, targetUser, warningCount) {
  const thresholds = config.warnings?.thresholds ?? [];
  const matched = thresholds.find((t) => t.count === warningCount);
  if (!matched) return null;

  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const reason = `Reached ${warningCount} warnings`;

  try {
    if (matched.action === 'timeout' && member?.moderatable) {
      await member.timeout(matched.durationMs, reason);
      await logAction(guild, {
        action: 'timeout',
        moderator: { tag: 'AutoMod (Warnings)', id: '0' },
        target: targetUser,
        reason,
        extra: { Duration: formatDuration(matched.durationMs) },
      });
      return `Auto-action: timed out for ${formatDuration(matched.durationMs)} (warning threshold).`;
    }
    if (matched.action === 'kick' && member?.kickable) {
      await member.kick(reason);
      await logAction(guild, {
        action: 'kick',
        moderator: { tag: 'AutoMod (Warnings)', id: '0' },
        target: targetUser,
        reason,
      });
      return 'Auto-action: kicked (warning threshold).';
    }
    if (matched.action === 'ban') {
      await guild.bans.create(targetUser.id, { reason });
      await logAction(guild, {
        action: 'ban',
        moderator: { tag: 'AutoMod (Warnings)', id: '0' },
        target: targetUser,
        reason,
      });
      return 'Auto-action: banned (warning threshold).';
    }
  } catch (err) {
    console.error('Threshold action failed:', err);
  }
  return null;
}

module.exports = { applyThresholdAction };