const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { prefix } = require('../../config/config');

module.exports = {
    name: 'prefix',
    description: 'View or change the bot\'s prefix',
    async execute(message, args) {
        try {
            if (!args.length) {
                const viewEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('🔧 Bot Prefix')
                    .setDescription(`Current prefix: \`${prefix}\`\n\nExample: \`${prefix}ping\``)
                    .setFooter({ text: 'Georgia State Roleplay Bot • Prefix Information' })
                    .setTimestamp();

                return message.reply({
                    embeds: [viewEmbed]
                });
            }

            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ You need Administrator permissions to change the prefix.');
            }

            const newPrefix = args[0];
            
            // Validate prefix length
            if (newPrefix.length > 3) {
                return message.reply('❌ Prefix must be 3 characters or less.');
            }

            // Validate prefix characters
            if (!/^[!@#$%^&*()\[\]{}\-_=+;:'",.<>/?\\|`~]+$/.test(newPrefix)) {
                return message.reply('❌ Invalid prefix. Please use only special characters.');
            }

            const configPath = path.join(__dirname, '../../config/config.js');

            try {
                const configContent = await fs.readFile(configPath, 'utf8');
                
                // Validate config file content
                if (!configContent.includes('prefix:')) {
                    throw new Error('Invalid config file structure');
                }

                const updatedContent = configContent.replace(
                    /prefix:\s*['"](.*)['"]/,
                    `prefix: "${newPrefix}"`
                );

                await fs.writeFile(configPath, updatedContent, 'utf8');

                const setEmbed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('✅ Prefix Updated')
                    .setDescription(`The bot's prefix has been updated to: \`${newPrefix}\`\n\nExample: \`${newPrefix}ping\``)
                    .setFooter({ text: 'Georgia State Roleplay Bot • Prefix Updated' })
                    .setTimestamp();

                await message.reply({
                    embeds: [setEmbed]
                });

                // Reload the config
                delete require.cache[require.resolve('../../config/config')];
                require('../../config/config');
            } catch (error) {
                console.error('Error updating prefix:', error);
                
                // Handle specific error types
                if (error.code === 'ENOENT') {
                    await message.reply('❌ Configuration file not found. Please contact a developer.');
                } else if (error.code === 'EACCES') {
                    await message.reply('❌ Permission denied while updating prefix. Please check file permissions.');
                } else if (error.message === 'Invalid config file structure') {
                    await message.reply('❌ Invalid configuration file structure. Please contact a developer.');
                } else {
                    await message.reply('❌ An unexpected error occurred while updating the prefix.');
                }
            }
        } catch (error) {
            console.error('Critical error in prefix command:', error);
            await message.reply('❌ A critical error occurred while processing the command.');
        }
    }
};