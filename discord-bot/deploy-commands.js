require('dotenv').config(); // 1. Must be at the very top!
const { REST, Routes } = require('discord.js');
const fs = require('fs');

// 2. DIAGNOSTIC LOGS
console.log('--- Environment Check ---');
console.log('Current Working Directory:', process.cwd());
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Found' : '❌ NOT FOUND');
console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? '✅ Found' : '❌ NOT FOUND');
console.log('-------------------------\n');

// Load all commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Starting to register slash commands...');
    console.log(`📝 Found ${commands.length} commands to register`);
    
    // Check if the ID is missing before sending the request to avoid Discord's crash
    if (!process.env.DISCORD_CLIENT_ID) {
      throw new Error("DISCORD_CLIENT_ID is undefined. Check your .env file!");
    }

    // Register commands globally
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );
    
    console.log('✅ Commands registered globally!');
    console.log('⏰ Commands may take 1-60 minutes to appear in all servers');
    console.log('🔄 Restart Discord app and try typing "/" in your server');
    
  } catch (error) {
    console.error('❌ Registration error:', error.message || error);
  }
})();