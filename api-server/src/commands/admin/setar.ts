import { ChannelType, EmbedBuilder, Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { db, guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { COLOR_ERROR, COLOR_SUCCESS, authorFooter } from "../util.js";

export default async function setar(message: Message, args: string[]): Promise<void> {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Você precisa ser Administrador.")] });
    return;
  }

  const subCmd = args[0]?.toLowerCase();

  if (!subCmd) {
    await message.reply({
      embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(
        "❌ Uso disponível:\n" +
        "`lsetar prefix <novo_prefixo>` — altera o prefixo do bot\n" +
        "`lsetar tellonym #canal` — define o canal para notificações anônimas\n" +
        "`lsetar tellonym desativar` — remove o canal configurado"
      )],
    });
    return;
  }

  // ── prefix ────────────────────────────────────────────────────────────────
  if (subCmd === "prefix" || subCmd === "prefixo") {
    const value = args[1];
    if (!value) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ Informe o novo prefixo! Ex: `lsetar prefix !`")] });
      return;
    }
    if (value.length > 5) {
      await message.reply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("❌ O prefixo deve ter no máximo 5 caracteres.")] });
      return;
    }
    await db.update(guildSettingsTable).set({ prefix: value }).where(eq(guildSettingsTable.id, message.guild!.id));
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(COLOR_SUCCESS)
        .setAuthor(authorFooter(message))
        .setDescription(`✅ Prefixo alterado para \`${value}\``)
        .setTimestamp()],
    });
    return;
  }

  // ── tellonym ──────────────────────────────────────────────────────────────
  // Requires column `tellonymChannelId text` in guildSettingsTable (@workspace/db migration)
  if (subCmd === "tellonym" || subCmd === "anon") {
    const second = args[1]?.toLowerCase();

    if (second === "desativar" || second === "off" || second === "disable") {
      await db
        .update(guildSettingsTable)
        .set({ tellonymChannelId: null } as any)
        .where(eq(guildSettingsTable.id, message.guild!.id));
      await message.reply({
        embeds: [new EmbedBuilder()
          .setColor(COLOR_SUCCESS)
          .setDescription("✅ Canal do tellonym desativado.\nNotificações voltarão a ser enviadas por DM.")
          .setTimestamp()],
      });
      return;
    }

    const channel = message.mentions.channels.first();
    if (!channel || channel.type !== ChannelType.GuildText) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(
          "❌ Mencione um canal de texto!\n" +
          "Ex: `lsetar tellonym #anônimos`\n" +
          "Para desativar: `lsetar tellonym desativar`"
        )],
      });
      return;
    }

    await db
      .update(guildSettingsTable)
      .set({ tellonymChannelId: (channel as TextChannel).id } as any)
      .where(eq(guildSettingsTable.id, message.guild!.id));

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(COLOR_SUCCESS)
        .setAuthor(authorFooter(message))
        .setDescription(`✅ Canal do tellonym configurado para ${channel}!\nAs notificações de mensagens anônimas serão enviadas lá.`)
        .setTimestamp()],
    });
    return;
  }

  await message.reply({
    embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription(
      "❌ Subcomando desconhecido.\nUse `lsetar prefix <valor>` ou `lsetar tellonym #canal`"
    )],
  });
}
