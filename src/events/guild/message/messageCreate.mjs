import { parseEmoji, PermissionFlagsBits } from "discord.js";
const cool = new Map();
/** 
 * @param {import("../../../structures/BotClient.mjs").BotClient} client
 * @param {import("discord.js").Message} message
*/
export default async (client, message) => {
    if(message.guildId && !message.guild || !message.channel) return;
    // check perm if the bot can see and view the channel.
    if(!client.DeezUtils.perms.checkPerms(message.channel, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return
    
    const guildBotRole = message.guild.roles.cache?.find?.(r => r.tags?.botId === client.user.id);
    const isPingOfMe = message.mentions?.has?.(client.user.id) || message.mentions?.has?.(guildBotRole);
    
    if(!isPingOfMe) return;
    
    if(cool.has(message.channelId)) {
        if(client.DeezUtils.perms.checkPerms(message.channel, PermissionFlagsBits.AddReactions)) return message.react(parseEmoji("🕛")).catch(() => null)
        else return; 
    };
    cool.set(message.channelId, true);
    setTimeout(() => cool.delete(message.channelId), 30000);

    const hasCommand = client.commands.find(c => c.name === message.content?.split?.(/ +/g)?.[1]?.trim?.()?.toLowerCase?.());
    return message.reply({
        content: `😒 Sorry, but you must use ${hasCommand ? hasCommand?.mention || `\`/${hasCommand.name}\`` : "Slash Commands"}, to get started use: ${client.commands.find(c => c.name === "play")?.mention || "`/play`"}\n> Or **link your account:** ${client.commands.find(c => c.name === "login")?.mention || "`/login`"}\n> **Need Support ☎️** ${client.configData.supportServer}`
    }).catch(() => null)
}