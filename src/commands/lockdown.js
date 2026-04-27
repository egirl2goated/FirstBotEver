const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock or unlock the current channel for @everyone.')
    .addSubcommand((s) =>
      s
        .setName('on')
        .setDescription('Lock the channel.')
        .addStringOption((o) => o.setName('reason').setDescription('Reason')),
    )
    .addSubcommand((s) =>
      s
        .setName('off')
        .setDescription('Unlock the channel.')
        .addStringOption((o) => o.setName('reason').setDescription('Reason')),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    if (interaction.channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: 'This command only works in text channels.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const everyone = interaction.guild.roles.everyone;

    try {
      if (sub === 'on') {
        await interaction.channel.permissionOverwrites.edit(
          everyone,
          { SendMessages: false, AddReactions: false, CreatePublicThreads: false, CreatePrivateThreads: false, SendMessagesInThreads: false },
          { reason: `${interaction.user.tag}: ${reason}` },
        );
        await logAction(interaction.guild, {
          action: 'lockdown',
          moderator: interaction.user,
          reason,
          extra: { Channel: `<#${interaction.channel.id}>` },
        });
        await interaction.reply(`Channel locked. Reason: ${reason}`);
      } else {
        await interaction.channel.permissionOverwrites.edit(
          everyone,
          { SendMessages: null, AddReactions: null, CreatePublicThreads: null, CreatePrivateThreads: null, SendMessagesInThreads: null },
          { reason: `${interaction.user.tag}: ${reason}` },
        );
        await logAction(interaction.guild, {
          action: 'unlock',
          moderator: interaction.user,
          reason,
          extra: { Channel: `<#${interaction.channel.id}>` },
        });
        await interaction.reply(`Channel unlocked. Reason: ${reason}`);
      }
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Failed to update channel permissions.', ephemeral: true });
    }
  },
};