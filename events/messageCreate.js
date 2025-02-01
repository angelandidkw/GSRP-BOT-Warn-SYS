const { EmbedBuilder, Collection, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Hardcoded configuration
const GROUP_TRIGGER = 'group';
const COOLDOWN_TIME = 300000; // 5 minutes in milliseconds
const TARGET_ROLE_ID = '1335366959675478088';

// Initialize prefix commands collection
const prefixCommands = new Collection();
const commandsPath = path.join(__dirname, '../commands/prefix');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    prefixCommands.set(command.name, command);
}

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // Check for group command
        if (message.content.toLowerCase().trim() === GROUP_TRIGGER.toLowerCase()) {
            if (!message.guild) {
                return message.reply('❌ This command can only be used in a server!');
            }

            const targetRole = message.guild.roles.cache.get(TARGET_ROLE_ID);
            if (!targetRole) {
                return message.reply('❌ The group role is not properly configured! Role ID: ' + TARGET_ROLE_ID);
            }
    
            const members = targetRole.members.map(m => m.user);
    
            // Create group link embed
            const groupEmbed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('🎮 Georgia State Roleplay Group Link')
                .setDescription([
                    '**Official Roblox Group:**',
                    'https://www.roblox.com/communities/35417785/Georgia-State-Roleplay-I-Whitelist-Only#!/about/join',
                    '',
                    '⚠️ Remember to follow all group rules!'
                ].join('\n'));

            // Send status message
            const statusMsg = await message.reply({
                embeds: [new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('✅ Sending Group Links')
                    .setDescription('Starting to send group links to all members...')
                ]
            });

            // Send to all role members
            let sentCount = 0;
            for (const member of members) {
                try {
                    await member.send({ embeds: [groupEmbed] });
                    sentCount++;
                    // Prevent rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Failed to DM ${member.tag}:`, error);
                }
            }

            // Update with final results
            await statusMsg.edit({
                embeds: [new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('✅ Group Links Sent')
                    .setDescription(`Successfully sent group link to ${sentCount}/${members.length} role members!`)
                ]
            });
        }
    }
};