import { EmbedBuilder, Message } from "discord.js";
import { COLOR_PRIMARY } from "../util.js";

const API = "https://nekos.best/api/v2";

async function fetchGif(category: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/${category}`);
    const json = (await res.json()) as { results?: { url: string }[] };
    return json.results?.[0]?.url ?? null;
  } catch {
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
