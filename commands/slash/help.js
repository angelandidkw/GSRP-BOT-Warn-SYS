const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { prefix } = require('../../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands and their usage'),

    async execute(interaction) {
        const isDeveloper = interaction.user.id === '1334705980407152723';
        const helpEmbed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: 'Georgia State Roleplay', iconURL: interaction.guild.iconURL() })
            .setTitle('📚 Command Help')
            .setDescription('Here are all available commands for Georgia State Roleplay Bot.')
            .addFields(
                {
                    name: '🛡️ Moderation Commands',
                    value: [
                        '⚡ /moderation warn - Warn a user',
                        '⚡ /moderation logs - View moderation logs for a user'
                    ].join('\n')
                },
                {
                    name: '🔧 Utility Commands',
                    value: [
                        '⚡ /ping - Check bot latency',
                        `⚡ ${prefix}ping - Check bot latency (prefix version)`
                    ].join('\n')
                },
                {
                    name: '📋 General Commands',
                    value: [
                        '⚡ group - Get the Roblox group link'
                    ].join('\n')
                },
                {
                    name: '📝 Command Usage',
                    value: [
                        '📌 Slash Commands',
                        '1. Type / to see available commands',
                        '2. Select a command and fill required options',
                        '',
                        '📌 Prefix Commands',
                        `1. Use ${prefix} before the command`,
                        `2. Example: ${prefix}ping`
                    ].join('\n')
                }
            )
            .setFooter({ text: 'Georgia State Roleplay Bot • Help Menu' })
            .setTimestamp();

        await interaction.reply({
            embeds: [helpEmbed],
            ephemeral: true
        });
    }
};
