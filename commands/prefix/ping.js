const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Check bot latency',
    async execute(message, args) {
        const sent = await message.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(message.client.ws.ping);

        const pingEmbed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle('🏓 Pong!')
            .setDescription([
                `🟢 Bot Latency: ${latency}ms`,
                `🟡 API Latency: ${apiLatency}ms`
            ].join('\n'))
            .setTimestamp();

        await sent.edit({ content: null, embeds: [pingEmbed] });
    }
};