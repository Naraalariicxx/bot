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

interface GifConfig {
  category: string;
  verb: string;       // "beijou"
  prep: string;       // "em" | "para" | ""
  emoji: string;
  selfMsg: string;
}

async function gifAction(message: Message, cfg: GifConfig): Promise<void> {
  const target = message.mentions.users.first();
  const targetText = target && target.id !== message.author.id
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

export async function beijar(msg: Message) {
  return gifAction(msg, { category: "kiss", verb: "deu um beijo", prep: "em", emoji: "💋", selfMsg: "" });
}
export async function abracar(msg: Message) {
  return gifAction(msg, { category: "hug", verb: "deu um abraço", prep: "em", emoji: "🤗", selfMsg: "" });
}
export async function socar(msg: Message) {
  return gifAction(msg, { category: "slap", verb: "socou", prep: "", emoji: "👊", selfMsg: "" });
}
export async function carinho(msg: Message) {
  return gifAction(msg, { category: "pat", verb: "fez carinho", prep: "em", emoji: "🥰", selfMsg: "" });
}
export async function chorar(msg: Message) {
  return gifAction(msg, { category: "cry", verb: "está chorando", prep: "", emoji: "😭", selfMsg: "" });
}
export async function morder(msg: Message) {
  return gifAction(msg, { category: "bite", verb: "mordeu", prep: "", emoji: "😬", selfMsg: "" });
}
export async function cutucar(msg: Message) {
  return gifAction(msg, { category: "poke", verb: "cutucou", prep: "", emoji: "👉", selfMsg: "" });
}
