import { EmbedBuilder, Message } from "discord.js";
import { COLOR_PRIMARY } from "../util.js";

export default async function avatar(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const url = target.displayAvatarURL({ size: 512, extension: "png" });

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle(`Avatar de ${target.username}`)
    .setImage(url)
    .setURL(url);

  await message.reply({ embeds: [embed] });
}
