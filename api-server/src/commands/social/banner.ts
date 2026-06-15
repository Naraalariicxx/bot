import { EmbedBuilder, Message } from "discord.js";
import { COLOR_PRIMARY } from "../util.js";

export default async function banner(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;

  // Fetch full user object to get banner
  const fetched = await target.fetch();
  const bannerUrl = fetched.bannerURL({ size: 1024, extension: "png" });

  if (!bannerUrl) {
    const embed = new EmbedBuilder()
      .setColor(COLOR_PRIMARY)
      .setDescription(`🖼️ **${target.username}** não tem um banner definido.`);
    await message.reply({ embeds: [embed] });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle(`Banner de ${target.username}`)
    .setImage(bannerUrl)
    .setURL(bannerUrl);

  await message.reply({ embeds: [embed] });
}
