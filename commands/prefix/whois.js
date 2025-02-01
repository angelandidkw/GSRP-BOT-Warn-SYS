const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'whois',
    description: 'Display information about a user',
    async execute(message, args) {
        const target = args[0] ? message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user : message.author;
        if (!target) {
            return message.reply('Please mention a user or provide a valid user ID.');
        }

        const member = message.guild.members.cache.get(target.id);
        if (!member) {
            return message.reply('Could not find that member in this server.');
        }

        const roles = member.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(role => role)
            .join(', ');

        const flags = {
            Staff: '👨‍💼',
            Partner: '🤝',
            BugHunter: '🐛',
            Developer: '👨‍💻',
            Supporter: '❤️'
        };

        const userFlags = target.flags.toArray();

        const whoisEmbed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: 'Georgia State Roleplay', iconURL: message.guild.iconURL() })
            .setTitle(`${target.tag}'s Information`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '👤 User Information', value: [
                    `• **Username:** ${target.username}`,
                    `• **Discriminator:** ${target.discriminator}`,
                    `• **ID:** ${target.id}`,
                    `• **Flags:** ${userFlags.length ? userFlags.map(flag => flags[flag]).join(' ') : 'None'}`,
                    `• **Account Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                    `• **Status:** ${member.presence?.status || 'Offline'}`
                ].join('\n') },
                { name: '📋 Member Information', value: [
                    `• **Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                    `• **Nickname:** ${member.nickname || 'None'}`,
                    `• **Roles [${member.roles.cache.size - 1}]:** ${roles}`
                ].join('\n') }
            )
            .setFooter({ text: 'Georgia State Roleplay Bot • User Information' })
            .setTimestamp();

        await message.reply({
            embeds: [whoisEmbed]
        });
    }
};