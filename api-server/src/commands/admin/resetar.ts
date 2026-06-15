import { EmbedBuilder, Message, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_SUCCESS, COLOR_ERROR, COLOR_WARN, authorFooter } from "../util.js";

export default async function resetar(message: Message, args: string[]): Promise<void> {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você precisa ser Administrador.")] });
    return;
  }

  const target = message.mentions.users.first();
  if (!target) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Uso: `lresetar @usuario`")] });
    return;
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("reset_confirm").setLabel("Confirmar reset").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("reset_cancel").setLabel("Cancelar").setStyle(ButtonStyle.Secondary),
  );

  const warn = new EmbedBuilder()
    .setColor(COLOR_WARN)
    .setTitle("⚠️ Confirmar reset")
    .setDescription(`Isso vai zerar **todos os coins, banco e reputação** de **${target.username}**.\nEssa ação não pode ser desfeita.`);

  const reply = await message.reply({ embeds: [warn], components: [row] });

  try {
    const interaction = await reply.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i => i.user.id === message.author.id,
      time: 15_000,
    });

    if (interaction.customId === "reset_confirm") {
      await db.update(usersTable)
        .set({ coins: 0, bank: 0, reputation: 0, lastDaily: null, lastWork: null, lastRep: null, marriedTo: null, isAfk: false, afkMessage: null })
        .where(eq(usersTable.id, target.id));

      const done = new EmbedBuilder()
        .setColor(COLOR_SUCCESS)
        .setAuthor(authorFooter(message))
        .setDescription(`✅ Economia de **${target.username}** resetada com sucesso.`)
        .setTimestamp();
      await interaction.update({ embeds: [done], components: [] });
    } else {
      const cancelled = new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Reset cancelado.");
      await interaction.update({ embeds: [cancelled], components: [] });
    }
  } catch {
    await reply.edit({ components: [] });
  }
}
