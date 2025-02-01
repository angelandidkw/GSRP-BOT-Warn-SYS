const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('View or change the bot\'s prefix')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View the current prefix'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set a new prefix (Admin only)')
                .addStringOption(option =>
                    option
                        .setName('new_prefix')
                        .setDescription('The new prefix to use')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const configPath = path.join(__dirname, '../../config/config.js');

            if (subcommand === 'view') {
                const { prefix } = require('../../config/config');
                const viewEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle('🔧 Bot Prefix')
                    .setDescription(`Current prefix: \`${prefix}\`\n\nExample: \`${prefix}ping\``)
                    .setFooter({ text: 'Georgia State Roleplay Bot • Prefix Information' })
                    .setTimestamp();

                await interaction.reply({
                    embeds: [viewEmbed],
                    ephemeral: true
                });
            }
            else if (subcommand === 'set') {
                const newPrefix = interaction.options.getString('new_prefix');

                // Validate prefix length
                if (newPrefix.length > 3) {
                    return interaction.reply({
                        content: '❌ Prefix must be 3 characters or less.',
                        ephemeral: true
                    });
                }

                // Validate prefix characters
                if (!/^[!@#$%^&*()\[\]{}\-_=+;:'",.<>/?\\|`~]+$/.test(newPrefix)) {
                    return interaction.reply({
                        content: '❌ Invalid prefix. Please use only special characters.',
                        ephemeral: true
                    });
                }

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

                    await interaction.reply({
                        embeds: [setEmbed],
                        ephemeral: true
                    });

                    // Reload the config
                    delete require.cache[require.resolve('../../config/config')];
                } catch (error) {
                    console.error('Error updating prefix:', error);
                    
                    // Handle specific error types
                    let errorMessage = '❌ An unexpected error occurred while updating the prefix.';
                    
                    if (error.code === 'ENOENT') {
                        errorMessage = '❌ Configuration file not found. Please contact a developer.';
                    } else if (error.code === 'EACCES') {
                        errorMessage = '❌ Permission denied while updating prefix. Please check file permissions.';
                    } else if (error.message === 'Invalid config file structure') {
                        errorMessage = '❌ Invalid configuration file structure. Please contact a developer.';
                    }

                    await interaction.reply({
                        content: errorMessage,
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            console.error('Critical error in prefix command:', error);
            await interaction.reply({
                content: '❌ A critical error occurred while processing the command.',
                ephemeral: true
            });
        }
    }
};