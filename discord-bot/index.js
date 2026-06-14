const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http'); 
const https = require('https'); // 1. Import https to make external requests
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds  // Doar Guilds pentru slash commands - FĂRĂ privileged intents
  ]
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
} else {
  console.warn('[WARNING] "commands" directory not found.');
}

// Bot ready event
client.once('ready', () => {
  console.log(`🤖 Perchance Discord Bot logged in as ${client.user.tag}`);
  console.log(`📡 Serving ${client.guilds.cache.size} servers`);
  console.log(`✨ Bot ready with ${client.commands.size} commands loaded`);
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Command execution error:', error);
    const errorReply = { content: '❌ There was an error executing this command!', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorReply);
    } else {
      await interaction.reply(errorReply);
    }
  }
});

// Create a basic web server to listen to a port
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is online and running!\n');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🌐 Web server is listening on port ${PORT}`);
  
  // 2. Anti-pause system: Ping the server every 10 minutes (600,000 ms)
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL; // Render automatically provides this env variable
  
  if (RENDER_URL) {
    setInterval(() => {
      https.get(RENDER_URL, (res) => {
        console.log(`🔄 Self-ping sent to ${RENDER_URL} - Status Code: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('❌ Anti-pause ping failed:', err.message);
      });
    }, 600000); 
  } else {
    console.warn('[WARNING] RENDER_EXTERNAL_URL environment variable is missing. Self-pinging is disabled.');
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);