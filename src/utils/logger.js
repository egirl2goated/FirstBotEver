const { EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../../config.json');

const COLORS = {
  ban: 0xc0392b,
  unban: 0x27ae60,
  kick: 0xe67e22,
  timeout: 0xf1c40f,
  untimeout: 0x2ecc71,
  warn: 0xf39c12,
  clear: 0x95a5a6,
  slowmode: 0x3498db,
  lockdown: 0x8e44ad,
  unlock: 0x1abc9c,
  automod: 0xe74c3c,
  info: 0x3498db,
};

function findLogChannel(guild) {
  return guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === config.logChannelName,
  );
}

async function logAction(guild, { action, moderator, target, reason, extra }) {
  const channel = findLogChannel(guild);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(COLORS[action] ?? COLORS.info)
    .setTitle(`Moderation: ${action.toUpperCase()}`)
    .setTimestamp();

  if (target) {
    embed.addFields({
      name: 'Target',
      value: target.tag ? `${target.tag} (\`${target.id}\`)` : String(target),
      inline: true,
    });
  }
  if (moderator) {
    embed.addFields({
      name: 'Moderator',
      value: `${moderator.tag} (\`${moderator.id}\`)`,
      inline: true,
    });
  }
  if (reason) embed.addFields({ name: 'Reason', value: reason });
  if (extra) {
    for (const [name, value] of Object.entries(extra)) {
      if (value !== undefined && value !== null && value !== '') {
        embed.addFields({ name, value: String(value), inline: true });
      }
    }
  }

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Failed to send log message:', err);
  }
}

module.exports = { logAction, findLogChannel };