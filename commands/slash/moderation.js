const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { loggingChannel } = require('../../config/config');

const DB_PATH = path.join(__dirname, '../../data/modLogs.json');

async function readDatabase() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const initialData = { logs: {} };
            await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        console.error('Error reading database:', error);
        throw new Error('Failed to read moderation logs database');
    }
}

async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing to database:', error);
        throw new Error('Failed to write to moderation logs database');
    }
}

const CONFIG_PATH = path.join(__dirname, '../../data/serverConfig.json');

async function getModChannel() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        const config = JSON.parse(data);
        return config.modChannel;
    } catch (error) {
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderation')
        .setDescription('Moderation commands panel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Check moderation logs for a user')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('The user to check logs for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a user')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('The user to warn')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for the warning')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a warning from a user')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('The user to remove warning from')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option
                        .setName('warning_id')
                        .setDescription('The ID of the warning to remove (check logs for IDs)')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Reason for removing the warning')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a warning')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('The user whose warning to edit')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option
                        .setName('warning_id')
                        .setDescription('The ID of the warning to edit (check logs for IDs)')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('new_reason')
                        .setDescription('New reason for the warning')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');
        const db = await readDatabase();

        if (!db.logs[target.id]) {
            db.logs[target.id] = [];
        }

        if (subcommand === 'warn') {
            const reason = interaction.options.getString('reason');
            const warning = {
                type: 'warning',
                reason: reason,
                moderator: interaction.user.id,
                timestamp: Date.now()
            };

            db.logs[target.id].push(warning);
            await writeDatabase(db);

            // Create DM embed
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF4747)
                .setTitle('Georgia State Roleplay')
                .setDescription('⚠️ **Warning Notice**\nYou have received a warning in our server.')
                .addFields(
                    { name: '📝 Reason', value: reason, inline: false },
                    { name: '👮 Issued By', value: interaction.user.tag, inline: true },
                    { name: '⏰ Issued At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                    { name: '🔍 Additional Information', value: 'This warning has been logged in our system. Multiple warnings may result in further disciplinary action.' }
                )
                .setFooter({ text: 'Please review our server rules to prevent future warnings' })
                .setTimestamp();

            // Initialize or increment warning count
            if (!db.warningCounts) {
                db.warningCounts = {};
            }
            if (!db.warningCounts[target.id]) {
                db.warningCounts[target.id] = 0;
            }
            db.warningCounts[target.id]++;

            const warningNumber = db.warningCounts[target.id];

            // Create warning embed for server
            const warnEmbed = new EmbedBuilder()
                .setColor(0xFF4747)
                .setAuthor({ name: 'Georgia State Roleplay', iconURL: interaction.guild.iconURL() })
                .setTitle(`⚠️ Warning Notice #${warningNumber}`)
                .setDescription([
                    '```diff',
                    '- A warning has been issued to a member',
                    '```',
                    `👤 **User:** ${target}`,
                    `📝 **Reason:** ${reason}`,
                    `👮 **Moderator:** ${interaction.user}`,
                    `📊 **Warning Count:** ${warningNumber}`,
                    '\n*This action has been logged in the system.*'
                ].join('\n'))
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            // Create button and row for both embeds
            const button = new ButtonBuilder()
                .setLabel('Sent by Georgia State Roleplay')
                .setCustomId('gsrp_warn_dm')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const row = new ActionRowBuilder().addComponents(button);

            // Send DM to user
            try {
                await target.send({ embeds: [dmEmbed], components: [row] });
            } catch (error) {
                console.error('Could not send DM to user:', error);
                await interaction.followUp({ 
                    content: '⚠️ Warning was logged but I couldn\'t send a DM to the user. They might have DMs disabled.',
                    ephemeral: true
                });
            }

            // Send to server
            await interaction.reply({ 
                embeds: [warnEmbed],
                components: [row]
            });
        }

        else if (subcommand === 'remove') {
            const warningId = interaction.options.getInteger('warning_id') - 1;
            const reason = interaction.options.getString('reason');
            const userLogs = db.logs[target.id];

            if (warningId < 0 || warningId >= userLogs.length) {
                return interaction.reply({
                    content: '❌ Invalid warning ID. Please check the logs and provide a valid warning ID.',
                    ephemeral: true
                });
            }

            const removedWarning = userLogs[warningId];
            userLogs.splice(warningId, 1);
            await writeDatabase(db);

            const removeEmbed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('Georgia State Roleplay')
                .setDescription(`✅ **Warning Removed**\nA warning has been removed from ${target}`)
                .addFields(
                    { name: '• Original Warning', value: removedWarning.reason, inline: false },
                    { name: '• Removal Reason', value: reason, inline: false },
                    { name: '• Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
                )
                .setFooter({ text: `Removed by ${interaction.user.tag} • Georgia State Roleplay Moderation` })
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(loggingChannel);
            if (logChannel) {
                await logChannel.send({ embeds: [removeEmbed] });
            }

            await interaction.reply({
                embeds: [removeEmbed]
            });

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('Georgia State Roleplay')
                    .setDescription('✅ **Warning Removed**\nA warning has been removed from your record.')
                    .addFields(
                        { name: '📝 Original Warning', value: removedWarning.reason, inline: false },
                        { name: '🗑️ Removal Reason', value: reason, inline: false },
                        { name: '👮 Removed By', value: interaction.user.tag, inline: true },
                        { name: '⏰ Removed At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                const dmButton = new ButtonBuilder()
                    .setLabel('Sent by Georgia State Roleplay')
                    .setCustomId('gsrp_remove_dm')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const dmRow = new ActionRowBuilder().addComponents(dmButton);

                await target.send({ embeds: [dmEmbed], components: [dmRow] });
            } catch (error) {
                console.error('Could not send DM to user:', error);
            }
        }

        else if (subcommand === 'edit') {
            const warningId = interaction.options.getInteger('warning_id') - 1;
            const newReason = interaction.options.getString('new_reason');
            const userLogs = db.logs[target.id];

            if (warningId < 0 || warningId >= userLogs.length) {
                return interaction.reply({
                    content: '❌ Invalid warning ID. Please check the logs and provide a valid warning ID.',
                    ephemeral: true
                });
            }

            const oldReason = userLogs[warningId].reason;
            userLogs[warningId].reason = newReason;
            await writeDatabase(db);

            const editEmbed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('Georgia State Roleplay')
                .setDescription(`📝 **Warning Edited**\nA warning has been edited for ${target}`)
                .addFields(
                    { name: '• Original Reason', value: oldReason, inline: false },
                    { name: '• New Reason', value: newReason, inline: false },
                    { name: '• Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
                )
                .setFooter({ text: `Edited by ${interaction.user.tag} • Georgia State Roleplay Moderation` })
                .setTimestamp();

            const logChannel = interaction.guild.channels.cache.get(loggingChannel);
            if (logChannel) {
                await logChannel.send({ embeds: [editEmbed] });
            }

            await interaction.reply({
                embeds: [editEmbed]
            });

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('Georgia State Roleplay')
                    .setDescription('📝 **Warning Updated**\nA warning in your record has been updated.')
                    .addFields(
                        { name: '📄 Original Reason', value: oldReason, inline: false },
                        { name: '📝 New Reason', value: newReason, inline: false },
                        { name: '👮 Edited By', value: interaction.user.tag, inline: true },
                        { name: '⏰ Edited At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                const dmButton = new ButtonBuilder()
                    .setLabel('Sent by Georgia State Roleplay')
                    .setCustomId('gsrp_edit_dm')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const dmRow = new ActionRowBuilder().addComponents(dmButton);

                await target.send({ embeds: [dmEmbed], components: [dmRow] });
            } catch (error) {
                console.error('Could not send DM to user:', error);
            }
        }

        else if (subcommand === 'logs') {
            const userLogs = db.logs[target.id] || [];
            
            function getInfractionEmoji(type) {
                const emojis = {
                    'warning': '⚠️',
                    'mute': '🔇',
                    'kick': '👢',
                    'ban': '🔨',
                    'timeout': '⏰'
                };
                return emojis[type] || '📝';
            }
            
            const logsEmbed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setAuthor({ name: 'Georgia State Roleplay', iconURL: interaction.guild.iconURL() })
                .setTitle(`📋 Moderation Logs for ${target.tag}`)
                .setDescription([
                    '**User Information**',
                    `• **User:** ${target}`,
                    `• **ID:** \`${target.id}\``,
                    `• **Created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                    `• **Total Infractions:** \`${userLogs.length}\``,
                ].join('\n'))
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            if (userLogs.length === 0) {
                logsEmbed.addFields({ 
                    name: '✨ Clean Record', 
                    value: 'No moderation history found for this user.'
                });
            } else {
                const formattedLogs = userLogs.slice(-10).map((log, index) => {
                    const moderator = interaction.guild.members.cache.get(log.moderator);
                    return [
                        `**${index + 1}.** ${log.type.toUpperCase()}`,
                        `${getInfractionEmoji(log.type)} **Details:**`,
                        `> 📝 Reason: ${log.reason}`,
                        `> 👮 Moderator: ${moderator ? moderator.user.tag : 'Unknown'}`,
                        `> ⏰ When: <t:${Math.floor(log.timestamp / 1000)}:R>`,
                        ''
                    ].join('\n');
                });
        
                logsEmbed.addFields({
                    name: '📜 Infraction History',
                    value: formattedLogs.join('\n').slice(0, 1024)
                });
        
                if (userLogs.length > 10) {
                    logsEmbed.setFooter({ 
                        text: `📌 Showing most recent 10 of ${userLogs.length} infractions`
                    });
                }
            }
        
            const button = new ButtonBuilder()
                .setLabel('Sent by Georgia State Roleplay')
                .setCustomId('gsrp_logs')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
        
            const row = new ActionRowBuilder().addComponents(button);
        
            await interaction.reply({
                embeds: [logsEmbed],
                components: [row]
            });
        }
    },

    getInfractionEmoji: function(type) {
        const emojis = {
            'warning': '⚠️',
            'mute': '🔇',
            'kick': '👢',
            'ban': '🔨',
            'timeout': '⏰'
        };
        return emojis[type] || '📝';
    }
};