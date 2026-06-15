import { EmbedBuilder, Message } from "discord.js";
import { COLOR_PRIMARY } from "../util.js";
import { logger } from "../../lib/logger.js";

const API = "https://nekos.best/api/v2";

async function fetchGif(category: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API}/${category}`, {
      signal: controller.signal,
      headers: { "User-Agent": "LuxBot/1.0 (Discord Bot)" },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      logger.warn({ category, status: res.status }, "nekos.best non-ok response");
      return null;
    }
    const json = (await res.json()) as { results?: { url: string }[] };
    const url = json.results?.[0]?.url ?? null;
    if (!url) logger.warn({ category, json }, "nekos.best no url in response");
    return url;
  } catch (err) {
    logger.error({ category, err: String(err) }, "fetchGif failed");
    return null;
  }
}

export interface GifConfig {
  category: string;
  verb: string;
  prep: string;
  emoji: string;
}

export async function gifAction(message: Message, cfg: GifConfig): Promise<void> {
  const target = message.mentions.users.first();
  const targetText =
    target && target.id !== message.author.id
      ? ` ${cfg.prep ? cfg.prep + " " : ""}**${target.username}**`
      : "";

  const gifUrl = await fetchGif(cfg.category);

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setDescription(`${cfg.emoji} **${message.author.username}** ${cfg.verb}${targetText}`)
    .setTimestamp();

  if (gifUrl) embed.setImage(gifUrl);
  await message.reply({ embeds: [embed] });
}
