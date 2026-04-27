const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listWarnings } = require('../utils/warnings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show info about a user (joined, created, roles, warnings).')
    .addUserOption((o) => o.setName('user').setDescription('User to inspect'))
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    const warnings = listWarnings(interaction.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setTitle(`User Info — ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setColor(0x3498db)
      .addFields(
        { name: 'ID', value: `\`${target.id}\``, inline: true },
        { name: 'Bot', value: target.bot ? 'Yes' : 'No', inline: true },
        {
          name: 'Account created',
          value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
      );

    if (member) {
      embed.addFields(
        {
          name: 'Joined server',
          value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown',
          inline: true,
        },
        {
          name: 'Highest role',
          value: member.roles.highest?.toString() ?? 'None',
          inline: true,
        },
        {
          name: 'Roles',
          value:
            member.roles.cache
              .filter((r) => r.id !== interaction.guild.id)
              .map((r) => r.toString())
              .slice(0, 20)
              .join(', ') || 'None',
        },
      );
      if (member.isCommunicationDisabled()) {
        embed.addFields({
          name: 'Timed out until',
          value: `<t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:F>`,
        });
      }
    } else {
      embed.addFields({ name: 'Server membership', value: 'Not in this server' });
    }

    embed.addFields({ name: 'Warnings', value: String(warnings.length), inline: true });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};