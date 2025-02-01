const { REST, Routes } = require('discord.js');
const { clientId, guildId } = require('./config/config');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const slashCommandsPath = path.join(__dirname, 'commands', 'slash');

// Validate environment variables
if (!process.env.TOKEN) {
    console.error('❌ Missing TOKEN in environment variables');
    process.exit(1);
}

if (!clientId || !guildId) {
    console.error('❌ Missing clientId or guildId in config file');
    process.exit(1);
}

// Ensure the commands directory exists
if (!fs.existsSync(slashCommandsPath)) {
    console.error(`❌ Commands directory not found: ${slashCommandsPath}`);
    process.exit(1);
}

const commandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length === 0) {
    console.warn('⚠️ No command files found in the slash commands directory');
    process.exit(0);
}

console.log(`📝 Loading ${commandFiles.length} command files...`);

// Load command files
for (const file of commandFiles) {
    try {
        const filePath = path.join(slashCommandsPath, file);
        const command = require(filePath);

        if (!command.data || !command.execute) {
            console.warn(`⚠️ Skipping ${file}: Missing required 'data' or 'execute' property`);
            continue;
        }

        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
    } catch (error) {
        console.error(`❌ Error loading command ${file}:\n`, error);
    }
}

if (commands.length === 0) {
    console.error('❌ No valid commands found to deploy');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🚀 Started deploying ${commands.length} application (/) commands...`);

        // Deploy commands
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`\n✨ Successfully deployed ${data.length} application (/) commands:\n`);
        
        // Log deployed commands
        data.forEach(cmd => {
            console.log(`📎 ${cmd.name}: ${cmd.description}`);
        });

        console.log('\n✅ Deployment complete!');
    } catch (error) {
        console.error('❌ Error deploying commands:\n', error);
        
        if (error.code === 50001) {
            console.error('🔒 Bot lacks permissions to create commands. Ensure it has the "applications.commands" scope.');
        } else if (error.code === 50013) {
            console.error('🔒 Bot lacks permissions in the guild. Check bot permissions.');
        }
        
        process.exit(1);
    }
})();