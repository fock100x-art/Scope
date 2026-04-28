import { getColor } from '../../config/bot.js';
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';
import { errorEmbed } from '../../utils/embeds.js';
import { getWelcomeConfig, updateWelcomeConfig } from '../../utils/database.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure the welcome system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up the welcome message')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send welcome messages to')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                // 🔥 HALKAN WAA ISBADALKA UGU MUHIIMSAN
                .addStringOption(option =>
                    option.setName('embed')
                        .setDescription('Paste your welcome embed JSON (Sapphire style)')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('ping')
                        .setDescription('Whether to ping the user')
                        .setRequired(false))),

    async execute(interaction) {
        try {
            const deferSuccess = await InteractionHelper.safeDefer(interaction);
            if (!deferSuccess) return;
        } catch (e) {
            return;
        }

        const { options, guild, client } = interaction;

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return await InteractionHelper.safeEditReply(interaction, {
                embeds: [errorEmbed('Missing Permissions', 'You need **Manage Server** permission.')],
                flags: MessageFlags.Ephemeral
            });
        }

        const subcommand = options.getSubcommand();

        if (subcommand === 'setup') {
            const channel = options.getChannel('channel');
            const embedInput = options.getString('embed');
            const ping = options.getBoolean('ping') ?? false;

            // 🔥 JSON PARSE
            let embedData;
            try {
                embedData = JSON.parse(embedInput);
            } catch (err) {
                return await InteractionHelper.safeEditReply(interaction, {
                    embeds: [errorEmbed('Invalid JSON', 'Embed JSON-ka waa khaldan yahay.')],
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                await updateWelcomeConfig(client, guild.id, {
                    enabled: true,
                    channelId: channel.id,
                    welcomeEmbed: embedData,
                    welcomePing: ping
                });

                // preview
                const embed = new EmbedBuilder()
                    .setColor(getColor('success'))
                    .setTitle('✅ Welcome Config Saved')
                    .setDescription(`Welcome message will be sent in ${channel}`)
                    .addFields(
                        { name: 'Ping', value: ping ? 'Yes' : 'No' }
                    );

                await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });

            } catch (error) {
                await InteractionHelper.safeEditReply(interaction, {
                    embeds: [errorEmbed('Error', 'Failed to save welcome config')],
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
};
