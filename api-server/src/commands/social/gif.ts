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
  verb: string;
  prep: string;
  emoji: string;
}

async function gifAction(message: Message, cfg: GifConfig): Promise<void> {
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

// ── Comandos existentes ──────────────────────────────────────────────────────
export async function beijar(msg: Message) {
  return gifAction(msg, { category: "kiss", verb: "deu um beijo", prep: "em", emoji: "💋" });
}
export async function abracar(msg: Message) {
  return gifAction(msg, { category: "hug", verb: "deu um abraço", prep: "em", emoji: "🤗" });
}
export async function socar(msg: Message) {
  return gifAction(msg, { category: "slap", verb: "socou", prep: "", emoji: "👊" });
}
export async function carinho(msg: Message) {
  return gifAction(msg, { category: "pat", verb: "fez carinho", prep: "em", emoji: "🥰" });
}
export async function chorar(msg: Message) {
  return gifAction(msg, { category: "cry", verb: "está chorando", prep: "", emoji: "😭" });
}
export async function morder(msg: Message) {
  return gifAction(msg, { category: "bite", verb: "mordeu", prep: "", emoji: "😬" });
}
export async function cutucar(msg: Message) {
  return gifAction(msg, { category: "poke", verb: "cutucou", prep: "", emoji: "👉" });
}

// ── Novos comandos de ação anime ─────────────────────────────────────────────
export async function dancar(msg: Message) {
  return gifAction(msg, { category: "dance", verb: "está dançando", prep: "", emoji: "💃" });
}
export async function acenar(msg: Message) {
  return gifAction(msg, { category: "wave", verb: "acenou", prep: "para", emoji: "👋" });
}
export async function rir(msg: Message) {
  return gifAction(msg, { category: "laugh", verb: "está rindo", prep: "", emoji: "😂" });
}
export async function sorrir(msg: Message) {
  return gifAction(msg, { category: "smile", verb: "sorriu", prep: "para", emoji: "😊" });
}
export async function dormir(msg: Message) {
  return gifAction(msg, { category: "sleep", verb: "está dormindo", prep: "", emoji: "😴" });
}
export async function pensar(msg: Message) {
  return gifAction(msg, { category: "think", verb: "está pensando", prep: "", emoji: "🤔" });
}
export async function piscar(msg: Message) {
  return gifAction(msg, { category: "wink", verb: "piscou", prep: "para", emoji: "😉" });
}
export async function chutar(msg: Message) {
  return gifAction(msg, { category: "kick", verb: "chutou", prep: "", emoji: "🦵" });
}
export async function highfive(msg: Message) {
  return gifAction(msg, { category: "highfive", verb: "deu um high five", prep: "para", emoji: "🙌" });
}
export async function nomnom(msg: Message) {
  return gifAction(msg, { category: "nom", verb: "está comendo", prep: "", emoji: "😋" });
}
