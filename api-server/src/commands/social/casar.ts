import { EmbedBuilder, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { db, usersTable, inventoryTable, shopItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { COLOR_PRIMARY, COLOR_ERROR, COLOR_SUCCESS, authorFooter } from "../util.js";

export default async function casar(message: Message, args: string[]): Promise<void> {
  const target = message.mentions.users.first();
  if (!target) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Mencione com quem quer casar. Ex: `lcasar @usuario`")] });
    return;
  }
  if (target.bot || target.id === message.author.id) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você não pode casar com bots ou consigo mesmo.")] });
    return;
  }

  const [proposer] = await db.select().from(usersTable).where(eq(usersTable.id, message.author.id));
  const [proposed] = await db.select().from(usersTable).where(eq(usersTable.id, target.id));

  if (proposer?.marriedTo) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ Você já é casado(a) com <@${proposer.marriedTo}>! Use \`ldivorcar\` primeiro.`)] });
    return;
  }
  if (proposed?.marriedTo) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ **${target.username}** já é casado(a) com outra pessoa.`)] });
    return;
  }

  // Check for marriage ring in inventory
  const ringItem = await db.select({ shop: shopItemsTable }).from(shopItemsTable).where(eq(shopItemsTable.name, "Marriage Ring")).then(r => r[0]);
  if (ringItem) {
    const [hasRing] = await db.select().from(inventoryTable).where(
      and(eq(inventoryTable.userId, message.author.id), eq(inventoryTable.itemId, ringItem.shop.id))
    );
    if (!hasRing) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você precisa de um **Marriage Ring** para se casar! Compre na `lloja`.")] });
      return;
    }
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("marry_yes").setLabel("💍 Aceitar").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("marry_no").setLabel("❌ Recusar").setStyle(ButtonStyle.Danger),
  );

  const proposal = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle("💍 Pedido de casamento!")
    .setDescription(`**${message.author.username}** está pedindo **${target.username}** em casamento!\n\n${target}, você aceita?`)
    .setFooter({ text: "Você tem 30 segundos para responder." });

  const reply = await message.reply({ embeds: [proposal], components: [row] });

  try {
    const interaction = await reply.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === target.id,
      time: 30_000,
    });

    if (interaction.customId === "marry_yes") {
      await db.update(usersTable).set({ marriedTo: target.id }).where(eq(usersTable.id, message.author.id));
      await db.update(usersTable).set({ marriedTo: message.author.id }).where(eq(usersTable.id, target.id));

      // Consume ring
      if (ringItem) {
        const [invRing] = await db.select().from(inventoryTable).where(
          and(eq(inventoryTable.userId, message.author.id), eq(inventoryTable.itemId, ringItem.shop.id))
        );
        if (invRing) {
          if (invRing.quantity > 1) await db.update(inventoryTable).set({ quantity: invRing.quantity - 1 }).where(eq(inventoryTable.id, invRing.id));
          else await db.delete(inventoryTable).where(eq(inventoryTable.id, invRing.id));
        }
      }

      const success = new EmbedBuilder()
        .setColor(COLOR_SUCCESS)
        .setTitle("💒 Casamento realizado!")
        .setDescription(`🎉 **${message.author.username}** e **${target.username}** agora são casados!`)
        .setTimestamp();

      await interaction.update({ embeds: [success], components: [] });
    } else {
      const refused = new EmbedBuilder()
        .setColor(COLOR_ERROR)
        .setDescription(`💔 **${target.username}** recusou o pedido de casamento.`);
      await interaction.update({ embeds: [refused], components: [] });
    }
  } catch {
    const expired = new EmbedBuilder().setColor(COLOR_ERROR).setDescription("⏰ O pedido de casamento expirou.");
    await reply.edit({ embeds: [expired], components: [] });
  }
}
