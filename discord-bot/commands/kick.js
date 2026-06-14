const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a member from the server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for kicking this member'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      
      // Fetch target and moderator member objects
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const moderatorMember = interaction.member;

      console.log(`👢 Processing kick request for: ${targetUser.tag} by ${interaction.user.tag}`);

      if (!targetMember) {
        throw new Error('That user does not appear to be currently in this server.');
      }

      // 1. Moderator role hierarchy check
      if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
        throw new Error('You cannot kick this user because they have an equal or higher role than you.');
      }

      // 2. Bot role hierarchy check
      if (!targetMember.kickable) {
        throw new Error('I cannot kick this user. They might have a higher role than my bot role.');
      }

      // Execute the kick action
      await targetMember.kick(`Kicked by ${interaction.user.tag}: ${reason}`);

      const embed = new EmbedBuilder()
        .setTitle('👢 Member Kicked')
        .setColor(0xff9100) // Vibrant Orange
        .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}`)
        .setFooter({ text: 'Helix AI Moderation' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      console.log(`✅ Successfully kicked ${targetUser.tag}`);

    } catch (error) {
      console.error('❌ Kick command error:', error);
      await interaction.editReply({
        content: `❌ **Error**: ${error.message || 'Failed to kick the user.'}`,
        ephemeral: true
      });
    }
  },
};