const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Places a member in timeout (mutes them)')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to timeout')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration of the timeout')
        .setRequired(true)
        .addChoices(
          { name: '60 Seconds', value: 60 * 1000 },
          { name: '5 Minutes', value: 5 * 60 * 1000 },
          { name: '10 Minutes', value: 10 * 60 * 1000 },
          { name: '1 Hour', value: 60 * 60 * 1000 },
          { name: '1 Day', value: 24 * 60 * 60 * 1000 },
          { name: '1 Week', value: 7 * 24 * 60 * 60 * 1000 }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for timing out this member'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('target');
      const duration = interaction.options.getInteger('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      
      // Fetch the target member and the moderator member
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const moderatorMember = interaction.member;

      console.log(`⏳ Processing timeout request for: ${targetUser.tag} by ${interaction.user.tag}`);

      if (!targetMember) {
        throw new Error('That user does not appear to be currently in this server.');
      }

      // 1. Role hierarchy check: Is the moderator trying to timeout someone with an equal or higher role?
      if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
        throw new Error('You cannot timeout this user because they have an equal or higher role than you.');
      }

      // 2. Bot hierarchy check: Can the bot actually modify this user?
      if (!targetMember.moderatable) {
        throw new Error('I cannot timeout this user. They may have a higher administrative role than my bot role.');
      }

      // Execute the timeout action
      await targetMember.timeout(duration, `Timeout by ${interaction.user.tag}: ${reason}`);

      // Map milliseconds back to friendly text strings for the embed
      const durationChoices = {
        [60 * 1000]: '60 Seconds',
        [5 * 60 * 1000]: '5 Minutes',
        [10 * 60 * 1000]: '10 Minutes',
        [60 * 60 * 1000]: '1 Hour',
        [24 * 60 * 60 * 1000]: '1 Day',
        [7 * 24 * 60 * 60 * 1000]: '1 Week'
      };
      const durationLabel = durationChoices[duration] || `${duration / 1000}s`;

      const embed = new EmbedBuilder()
        .setTitle('⏳ Member Timed Out')
        .setColor(0xffea00) // Bright Yellow
        .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Duration:** ${durationLabel}\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}`)
        .setFooter({ text: 'Helix AI Moderation' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      console.log(`✅ Successfully timed out ${targetUser.tag}`);

    } catch (error) {
      console.error('❌ Timeout command error:', error);
      await interaction.editReply({
        content: `❌ **Error**: ${error.message || 'Failed to timeout the user.'}`,
        ephemeral: true
      });
    }
  },
};