const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../data/serverConfig.json');

async function readConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const initialConfig = { modChannel: null };
            await fs.writeFile(CONFIG_PATH, JSON.stringify(initialConfig, null, 2));
            return initialConfig;
        }
        throw error;
    }
}

async function writeConfig(config) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = {
    name: 'setup',
    description: 'Setup bot configuration',
    async execute(message, args) {
        // Check if user has admin permissions
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You need Administrator permissions to use this command!');
        }

        if (!args[0]) {
            return message.reply('❌ Please provide a channel ID! Usage: `!setup channel_id`');
        }

        const channelId = args[0];
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel) {
            return message.reply('❌ Invalid channel ID! Please provide a valid channel ID.');
        }

        try {
            const config = await readConfig();
            config.modChannel = channelId;
            await writeConfig(config);

            await message.reply(`✅ Successfully set ${channel} as the moderation logs channel!`);
        } catch (error) {
            console.error('Setup error:', error);
            await message.reply('❌ An error occurred while saving the configuration.');
        }
    }
};