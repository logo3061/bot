const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generateImage } = require('../services/imageGenerator');
const { EnhancedPromptGenerator } = require('../../src/generators/EnhancedPromptGenerator');

const promptGenerator = new EnhancedPromptGenerator();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('generate')
    .setDescription('Generate AI art prompts and images')
    .addStringOption(option =>
      option.setName('style')
        .setDescription('Art style')
        .setRequired(true)
        .addChoices(
          { name: '🎌 Anime', value: 'anime' },
          { name: '🎬 Cinematic', value: 'cinematic' },
          { name: '📸 Photorealistic', value: 'photorealistic' },
          { name: '🎨 Digital Art', value: 'digital_art' },
          { name: '💥 Comic', value: 'comic' },
          { name: '🕹️ Pixel Art', value: 'pixel_art' }
        ))
    .addStringOption(option =>
      option.setName('subject')
        .setDescription('Main subject')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('image')
        .setDescription('Automatically generate an image? (True/False)')
        .setRequired(false)) // Changed to required to force a True or False choice
    .addBooleanOption(option =>
      option.setName('enhance')
        .setDescription('Enhance prompt using templates? (Defaults to false)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('mood')
        .setDescription('Mood for the prompt (Only applies if enhanced)')
        .setRequired(false)
        .addChoices(
          { name: '🔥 Dramatic', value: 'dramatic' },
          { name: '⭐ Epic', value: 'epic' },
          { name: '🌸 Peaceful', value: 'peaceful' },
          { name: '🌈 Vibrant', value: 'vibrant' },
          { name: '🌙 Mysterious', value: 'mysterious' }
        )),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const style = interaction.options.getString('style');
      const subject = interaction.options.getString('subject');
const generateImg = interaction.options.getBoolean('image') ?? true;
      const shouldEnhance = interaction.options.getBoolean('enhance') ?? false; 
      const mood = interaction.options.getString('mood') || 'dramatic';

      console.log(`🎯 Command Received: Style: ${style}, Subject: "${subject}", Enhance: ${shouldEnhance}, Image: ${generateImg}`);

      let promptText = '';
      let promptData = {};

      if (shouldEnhance) {
        console.log(`🔧 Enhancing prompt for style: ${style}...`);
        const enhancedResult = promptGenerator.generateEnhanced(style, subject, { mood });
        
        promptText = enhancedResult.text;
        promptData = {
          text: enhancedResult.text,
          style: enhancedResult.style,
          metadata: enhancedResult.metadata,
          negatives: enhancedResult.negatives,
          source: 'enhanced-local'
        };
      } else {
        console.log(`📝 Using raw user prompt...`);
        promptText = `${style.replace('_', ' ')} style, ${subject}`;
        
        promptData = {
          text: promptText,
          style: style,
          metadata: {
            wordCount: promptText.split(' ').length,
            characterCount: promptText.length,
            enhanced: false
          },
          negatives: null,
          source: 'raw-user'
        };
      }

      const embedTitle = shouldEnhance ? '✨ Enhanced Prompt Processed' : '📝 Raw Prompt Processed';

      const embed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setColor(shouldEnhance ? 0x00bcd4 : 0x4caf50)
        .addFields(
          { name: '🎨 Style', value: style.replace('_', ' '), inline: true },
          { name: '🎯 Subject', value: subject, inline: true },
          { name: '🎭 Mood', value: shouldEnhance ? mood : 'N/A (Raw)', inline: true },
          { name: '📊 Stats', value: `${promptData.metadata.wordCount} words • ${promptData.metadata.characterCount} chars`, inline: true },
          { name: '🧠 Mode', value: shouldEnhance ? '✅ Enhanced' : '❌ Raw Prompt', inline: true },
          { name: '🔗 Source', value: promptData.source, inline: true },
          { name: '📝 Final Prompt Text', value: `\`\`\`\n${promptData.text}\n\`\`\`` }
        )
        .setFooter({ text: 'Helix AI' })
        .setTimestamp();

      if (promptData.negatives) {
        embed.addFields({
          name: '🚫 Negative Prompts',
          value: `\`\`\`\n${promptData.negatives}\n\`\`\``,
          inline: false
        });
      }

      // Automatically generate image if option was set to True
      if (generateImg) {
        embed.setDescription('🎨 Automatically generating image with the prompt...');
        await interaction.editReply({ embeds: [embed] });

        try {
          console.log('🖼️ Starting image generation...');
          const imageBuffer = await generateImage(promptData.text);
          const attachment = new AttachmentBuilder(imageBuffer, { name: 'perchance-output.png' });
          
          embed.setDescription('🖼️ Image automatically generated successfully!')
            .setImage('attachment://perchance-output.png');
          
          await interaction.editReply({ 
            embeds: [embed],
            files: [attachment]
          });
          
          console.log('✅ Image generation completed successfully');
          
        } catch (imageError) {
          console.error('❌ Image generation failed:', imageError.message);
          embed.setDescription('✅ Prompt processed! ❌ Image generation failed.')
            .setColor(0xff9800);
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        // If image was set to False, only send the prompt breakdown text
        embed.setDescription('ℹ️ Image generation skipped by user choice.');
        await interaction.editReply({ embeds: [embed] });
      }

      console.log('✅ Generate command completed successfully');

    } catch (error) {
      console.error('❌ Generate command error:', error);
      const errorMessage = error.message || 'Command execution failed';
      
      await interaction.editReply({
        content: `❌ **Error**: ${errorMessage}\n\nPlease try again.`,
        ephemeral: true
      });
    }
  },
};