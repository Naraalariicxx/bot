import { EmbedBuilder, Message } from "discord.js";
import { db, usersTable, inventoryTable, shopItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_PRIMARY, fmt } from "../util.js";

export default async function perfil(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));

  const equippedItems = user
    ? await db
        .select({ shop: shopItemsTable })
        .from(inventoryTable)
        .leftJoin(shopItemsTable, eq(inventoryTable.itemId, shopItemsTable.id))
        .where(eq(inventoryTable.userId, target.id))
        .then((rows) => rows.filter((r) => r.shop).map((r) => `${r.shop!.emoji} ${r.shop!.name}`))
    : [];

  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle(`📋 Perfil de ${target.username}`)
    .setThumbnail(target.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: "💵 Carteira", value: `🪙 ${fmt(user?.coins ?? 0)}`, inline: true },
      { name: "🏦 Banco", value: `🪙 ${fmt(user?.bank ?? 0)}`, inline: true },
      { name: "⭐ Reputação", value: `${user?.reputation ?? 0}`, inline: true },
      { name: "💍 Casado(a) com", value: user?.marriedTo ? `<@${user.marriedTo}>` : "Solteiro(a)", inline: true },
      { name: "💤 AFK", value: user?.isAfk ? `Sim — *${user.afkMessage ?? ""}*` : "Não", inline: true },
      { name: "🎒 Itens equipados", value: equippedItems.length ? equippedItems.join(", ") : "Nenhum", inline: false },
    )
    .setFooter({ text: `ID: ${target.id}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
