const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listWarnings, removeWarning, clearWarnings } = require('../utils/warnings');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Manage user warnings.')
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('List warnings for a user.')
        .addUserOption((o) => o.setName('user').setDescription('User to list warnings for').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Remove a single warning by ID.')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
        .addStringOption((o) => o.setName('warning_id').setDescription('Warning ID (from /warnings list)').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('clear')
        .setDescription('Clear all warnings for a user.')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user', true);

    if (sub === 'list') {
      const warnings = listWarnings(interaction.guild.id, target.id);
      if (!warnings.length) {
        return interaction.reply({ content: `**${target.tag}** has no warnings.`, ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setTitle(`Warnings for ${target.tag}`)
        .setColor(0xf39c12)
        .setDescription(
          warnings
            .slice(-15)
            .map(
              (w, i) =>
                `**${i + 1}.** \`${w.id}\` — <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:R>\n` +
                `Reason: ${w.reason}\nModerator: <@${w.moderatorId}>`,
            )
            .join('\n\n'),
        )
        .setFooter({ text: `Total: ${warnings.length}` });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'remove') {
      const warningId = interaction.options.getString('warning_id', true);
      const ok = removeWarning(interaction.guild.id, target.id, warningId);
      if (!ok) {
        return interaction.reply({ content: 'No warning with that ID was found.', ephemeral: true });
      }
      await logAction(interaction.guild, {
        action: 'warn',
        moderator: interaction.user,
        target,
        reason: `Removed warning \`${warningId}\``,
      });
      return interaction.reply({ content: `Removed warning \`${warningId}\` from **${target.tag}**.`, ephemeral: true });
    }

    if (sub === 'clear') {
      const count = clearWarnings(interaction.guild.id, target.id);
      await logAction(interaction.guild, {
        action: 'warn',
        moderator: interaction.user,
        target,
        reason: `Cleared all warnings (${count})`,
      });
      return interaction.reply({ content: `Cleared **${count}** warning(s) for **${target.tag}**.`, ephemeral: true });
    }
  },
};