const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all moderation commands.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Moderation Bot — Commands')
      .setColor(0x5865f2)
      .setDescription('All commands use Discord permissions to control access.')
      .addFields(
        { name: '/ban', value: 'Ban a user (optionally delete recent messages).' },
        { name: '/unban', value: 'Unban a user by ID.' },
        { name: '/kick', value: 'Kick a member from the server.' },
        { name: '/timeout', value: 'Timeout a member (e.g. 10m, 1h, 2d).' },
        { name: '/untimeout', value: 'Remove a timeout from a member.' },
        { name: '/warn', value: 'Warn a member. Auto-actions trigger at thresholds in config.json.' },
        { name: '/warnings list|remove|clear', value: 'View or manage warnings for a user.' },
        { name: '/clear', value: 'Bulk delete recent messages (optionally from one user).' },
        { name: '/slowmode', value: 'Set channel slowmode in seconds (0 disables).' },
        { name: '/lockdown on|off', value: 'Lock or unlock the channel for @everyone.' },
        { name: '/userinfo', value: 'Show user details, roles, and warning count.' },
      )
      .setFooter({ text: 'Auto-mod runs in the background: anti-spam, anti-invite, bad-words.' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};