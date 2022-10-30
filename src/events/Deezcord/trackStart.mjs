import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { ButtonStyle, GuildAuditLogs, parseEmoji } from "discord.js";
import { Embed } from "../../structures/Embed.mjs";
import * as configData from "../../data/ConfigData.mjs";
import { inlineLocale } from "../../structures/i18n.mjs";

/** 
 * @param {import("../../structures/BotClient.mjs").BotClient} client
 * @param {import("erela.js").Player} player
 * @param {import("erela.js").Track & import("../../structures/Utils/TrackUtils.mjs").DeezUnresolvedDataType} track
*/
export default async (client, player, track) => {
    const guild = client.guilds.cache.get(player.guild);
    if(!guild) return player.destroy();

    player.set("np_msg", undefined);
    player.set("current", track);

    client.logger.debug(`🎵 Now ${track.autoplayCount ? "auto-" : ""}playing the Track ${track.author} - ${track.title} in ${guild.name}, requested by @${client.DeezUtils.track.getRequesterString(track.requester)}`);
    
    // get lyrics of db, from deezer and if not then from genius
    const ofDBDeezer = await client.db.deezerLyrics.findFirst({
        where: { trackId: String(track.identifier) },
        select: { LYRICS_ID: true, LYRICS_TEXT: true, LYRICS_WRITERS: true, LYRICS_COPYRIGHTS: true, LYRICS_SYNC_JSON: true }
    })
    if(ofDBDeezer && ofDBDeezer.LYRICS_TEXT) {
        try { ofDBDeezer.LYRICS_SYNC_JSON = JSON.parse(ofDBDeezer.LYRICS_SYNC_JSON); } catch { /* catch error */}
        player.queue.current.deezerLyrics = ofDBDeezer;
        track.deezerLyrics = ofDBDeezer;
    } else {
        const ofDbRes = await client.db.lyrics.findFirst({
            where: { trackId: track.identifier },
            select: { lyrics: true }
        }).catch(() => null);
        if(ofDbRes?.lyrics) {
            player.queue.current.geniusLyrics = ofDbRes?.lyrics;
            track.geniusLyrics = ofDbRes?.lyrics;
        }
    }
    // track.deezerLyrics || track.geniusLyrics;

    const guildLocale = client.getGuildLocale(player.guild)

    // send now playing message
    const channel = client.channels.cache.get(player.textChannel);
    let msg = null;
    if(channel) {
        const NpEmbed = new Embed().setThumbnail(track.thumbnail)
        NpEmbed.addField(`🎶 **${track.title}**`, `>>> **${inlineLocale(guildLocale, "general.words.duration")}:** \` ${client.DeezUtils.time.durationFormatted(track.duration, true)} \`\n**${inlineLocale(guildLocale, "general.words.requester")}:** <@${track.requester.id ?? track.requester}>`)
        
        const authorData = await client.DeezUtils.track.fetchAuthorData(track.authorData, track?.requester?.accessToken);
        // update queue datas
        if(!track.author && authorData.name) track.author = authorData.name;
        if(authorData) { track.authorData = authorData; player.queue.current.authorData = authorData; } 

        NpEmbed.setAuthor({
            name: authorData?.name ? `${authorData?.name} - © Deezcord` : `© Deezcord`,
            iconURL: authorData?.image ? `${authorData?.image}` : "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256",
            url: authorData?.link ? `${authorData?.link}` : "https://cdn.discordapp.com/avatars/1032998523123290182/83b2c200dbc11dd5e0a96dc83d600b17.webp?size=256"
        })
        
        
        if(track.autoplayCount) {
            const name = track.requester?.tag ?? track.requester?.username ?? 'users';
            NpEmbed.addField(track.flowTrack ? 
                inlineLocale(guildLocale, "trackstart.autoplayflow", { name }) : inlineLocale(guildLocale, "trackstart.autoplayrecommendation", { name }), 
                inlineLocale(guildLocale, "trackstart.requester", { autoplayCount: track.autoplayCount }))
        } else if(track.playlistData) {
            NpEmbed.addField(inlineLocale(guildLocale, "trackstart.playingplaylist"), `> [\`${track.playlistData.name}\`](${track.playlistData.link})`, true)
        } 
        if(track.albumData) {
            NpEmbed.addField(`${inlineLocale(guildLocale, "trackQueryAdding.tracksalbum")}:`, `> [\`${track.albumData.name}\`](${track.albumData.link})`, true)
        }

        if(track.fetchTime) {
            NpEmbed.setFooter({
                text: inlineLocale(guildLocale, "trackstart.tooktime", { time: track.fetchTime })
            })
        }
        let secondEmbed = null;
        
        const addedViaAutoplay = player.get("addedviaautoplay_flow") || player.get("addedviaautoplay");
        const addedViaFlow = player.get("addedviaautoplay_flow") ? true : false;
        if(addedViaAutoplay) {
            player.set("addedviaautoplay_flow", undefined);
            player.set("addedviaautoplay", undefined)
            const { deezerId, deezerName, deezerImage } = await client.db.userData.findFirst({
                where: { userId: track.requester?.id }
            }).catch(() => null) || {};
            const shortenlink = (link) => {
                link = link.replace("www.", "");
                if(link.endsWith("/")) link = link.substring(0, link.length - 1);
                return link;
            }
            const deezerLink = `https://www.deezer.com/profile/${deezerId}`;

            const mapFN = (track, index, extra) => `\`${index+(extra ? 1 : 0)}.\` [\`${client.DeezUtils.time.durationFormatted(track.duration, true)}\`] - ${track.authorData?.link ? `[**${track.authorData.name || track.author}**](${shortenlink(track.authorData.link)})` : `**${track.author}**`}: [${track.title}](${shortenlink(track.uri)})`;
            const icon = track.requester?.avatar && track.requester?.id ? client.rest.cdn.avatar(track.requester?.id, track.requester?.avatar, undefined, undefined, true) : this.client.rest.cdn.DefaultAvatar((track.requester?.discriminator || 6969) % 5);
            secondEmbed = new Embed()
                .setAuthor({
                    name: deezerName || undefined,
                    iconURL: deezerImage || configData.deezerLogo,
                    url: deezerLink
                })
                .setThumbnail(icon || undefined)
                .addField(inlineLocale(guildLocale, "trackstart.addedautoplay", { amount: addedViaAutoplay.length }), 
                addedViaFlow ? inlineLocale(guildLocale, "trackstart.byflowtracks", { ping: `<@${track.requester.id}>` }) : inlineLocale(guildLocale, "trackstart.byflowtracks", { ping: `<@${track.requester.id}>` }))
                .addField(inlineLocale(guildLocale, "trackstart.currentsong"), `>>> ${addedViaAutoplay.slice(0, 1).map((v, i) => mapFN(v, i, false)).join("\n")}`)
                .addField(inlineLocale(guildLocale, "trackstart.upcomingsongs"), `>>> ${addedViaAutoplay.slice(1, addedViaAutoplay.length).map((v, i) => mapFN(v, i, true)).join("\n\n")}`)
        }
        msg = await channel.send({ 
            embeds: [ NpEmbed, secondEmbed ].filter(Boolean),
            components: [
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder().setStyle(ButtonStyle.Link).setEmoji(client.DeezEmojis.deezer.parsed).setLabel("Link").setURL(track.uri),
                ].filter(Boolean))
            ]
        }).catch(console.warn);
        if(msg) player.set("np_msg", msg);
    }


    // now get the lyrics, and then edit the message --> track.deezerLyrics || track.geniusLyrics;
    const lyricsTime = Date.now();
    if(!track.deezerLyrics) {
        const deezerLyrics = await client.DeezUtils.track.getLyricsOfDeezer(track)
        if(deezerLyrics) {
            player.queue.current.deezerLyrics = deezerLyrics;
            track.deezerLyrics = deezerLyrics;
        } 
    } else if(!track.geniusLyrics) { // else try to get from genius Lyrics
        const geniusLyrics = await client.DeezUtils.track.getLyricsOfGenius(track)
        if(geniusLyrics) {
            player.queue.current.geniusLyrics = geniusLyrics;
            track.geniusLyrics = geniusLyrics;
        }
    }
    if(track.geniusLyrics || track.deezerLyrics) {
        if((Date.now() - lyricsTime) < 2000) await client.DeezUtils.time.delay(2000 - (Date.now() - lyricsTime));
        player.set("current", track);
        // Edit now playing message that lyrics are available
        // mayorly display genius track lyrics
        //console.log(!!track.deezerLyrics, "deezerlyrics");
        //console.log(!!track.geniusLyrics, "geniusLyrics");
    }


    
    // for autoplay recommendations.
    if(!track.fetchedFromDeezer && track.requester.accessToken) await client.DeezApi.deezer.fetch.track(track.identifier, false, track.requester.accessToken).catch(() => null);
}