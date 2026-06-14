const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a member from the server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for banning this member'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers), // Restricts command visibility

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const targetUser = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      
      // Fetch target and moderator member objects
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      const moderatorMember = interaction.member;

      console.log(`🔨 Processing ban request for: ${targetUser.tag} by ${interaction.user.tag}`);

      // Check if target exists in guild and apply hierarchy rules
      if (targetMember) {
        // 1. Moderator role hierarchy check
        if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
          throw new Error('You cannot ban this user because they have an equal or higher role than you.');
        }

        // 2. Bot role hierarchy check
        if (!targetMember.bannable) {
          throw new Error('I cannot ban this user. They might have a higher role than my bot role or administrative permissions.');
        }
      }

      // Execute the ban action (Works even if user isn't currently in the server)
      await interaction.guild.members.ban(targetUser.id, { reason: `Banned by ${interaction.user.tag}: ${reason}` });

      const embed = new EmbedBuilder()
        .setTitle('🔨 Member Banned')
        .setColor(0xff1744) // Intense Red
        .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Moderator:** ${interaction.user}\n**Reason:** ${reason}`)
        .setFooter({ text: 'Perchance AI Moderation' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      console.log(`✅ Successfully banned ${targetUser.tag}`);

    } catch (error) {
      console.error('❌ Ban command error:', error);
      await interaction.editReply({
        content: `❌ **Error**: ${error.message || 'Failed to ban the user.'}`,
        ephemeral: true
      });
    }
  },
};