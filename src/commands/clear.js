const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete recent messages in this channel.')
    .addIntegerOption((o) =>
      o.setName('amount').setDescription('Number of messages (1-100)').setMinValue(1).setMaxValue(100).setRequired(true),
    )
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.options.getUser('user');

    if (interaction.channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: 'This command only works in text channels.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });
      if (user) messages = messages.filter((m) => m.author.id === user.id);

      const filtered = messages.first(amount);
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletable = filtered.filter((m) => m.createdTimestamp > fourteenDaysAgo);

      const deleted = await interaction.channel.bulkDelete(deletable, true);

      await logAction(interaction.guild, {
        action: 'clear',
        moderator: interaction.user,
        reason: user ? `Cleared messages from ${user.tag}` : 'Bulk message clear',
        extra: { Channel: `<#${interaction.channel.id}>`, Deleted: deleted.size },
      });

      await interaction.editReply(
        `Deleted **${deleted.size}** message(s)${user ? ` from **${user.tag}**` : ''}.` +
          (deleted.size < amount ? '\n(Messages older than 14 days cannot be bulk-deleted.)' : ''),
      );
    } catch (err) {
      console.error(err);
      await interaction.editReply('Failed to delete messages.');
    }
  },
};