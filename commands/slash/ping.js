const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            const latency = Date.now() - interaction.createdTimestamp;
            await interaction.editReply({
                content: `🏓 Pong! Latency: ${latency}ms`,
            });
        } catch (error) {
            console.error('Error in ping command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'Failed to get ping information.',
                    flags: 64 // This makes the message ephemeral
                });
            }
        }
    }
};