import { EmbedBuilder, Message } from "discord.js";

export const COLOR_PRIMARY = 0x5865f2;
export const COLOR_SUCCESS = 0x57f287;
export const COLOR_ERROR = 0xed4245;
export const COLOR_GOLD = 0xfee75c;
export const COLOR_WARN = 0xffa500;

export function coins(n: number): string {
  return `🪙 **${n.toLocaleString("pt-BR")}**`;
}

export function fmt(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function cooldownLeft(lastTime: Date | null, cooldownMs: number): number {
  if (!lastTime) return 0;
  const elapsed = Date.now() - lastTime.getTime();
  return Math.max(0, cooldownMs - elapsed);
}

export function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function errEmbed(msg: string): EmbedBuilder {
  return new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ ${msg}`);
}

export function okEmbed(msg: string): EmbedBuilder {
  return new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ ${msg}`);
}

export function authorFooter(message: Message) {
  return {
    name: message.author.username,
    iconURL: message.author.displayAvatarURL(),
  };
}

export function footerData(message: Message) {
  return {
    text: message.author.username,
    iconURL: message.author.displayAvatarURL(),
  };
}
