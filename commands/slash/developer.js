const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('developer')
        .setDescription('Display information about the bot developers'),

    async execute(interaction) {
        const developers = [
            {
                id: '1334705980407152723',
                name: 'Network_.angel',
                github: 'https://github.com/angelandidkw',
                role: 'Lead Developer'
            }
        ];

        const devEmbed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: 'Georgia State Roleplay', iconURL: interaction.guild.iconURL() })
            .setTitle('👨‍💻 Developer Information')
            .setDescription('Meet the developer behind Georgia State Roleplay Bot!')
            .addFields(
                ...developers.map(dev => ({
                    name: `${dev.name} (${dev.role})`,
                    value: [
                        `• **Discord ID:** ${dev.id}`,
                        `• **GitHub:** [${dev.name}](${dev.github})`,
                        '• **Status:** Active'
                    ].join('\n'),
                    inline: false
                }))
            )
            .setFooter({ text: 'Georgia State Roleplay Bot • Developer Information' })
            .setTimestamp();

        await interaction.reply({
            embeds: [devEmbed],
            ephemeral: true
        });
    }
};