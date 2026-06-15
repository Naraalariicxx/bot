import { EmbedBuilder, Message } from "discord.js";
import { COLOR_PRIMARY, authorFooter } from "./util.js";

const PREFIX = "l";

export default async function ajuda(message: Message): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(COLOR_PRIMARY)
    .setTitle("📖 Comandos disponíveis")
    .setThumbnail(message.client.user?.displayAvatarURL() ?? null)
    .addFields(
      {
        name: "💰 Economia",
        value: [
          `\`${PREFIX}saldo\` — Ver carteira`,
          `\`${PREFIX}daily\` — Recompensa diária`,
          `\`${PREFIX}trabalhar\` — Trabalhar (1h cooldown)`,
          `\`${PREFIX}apostar <valor>\` — Apostar coins`,
          `\`${PREFIX}transferir @user <valor>\` — Transferir coins`,
          `\`${PREFIX}ranking\` — Top 10 mais ricos`,
          `\`${PREFIX}loja\` — Ver loja`,
          `\`${PREFIX}comprar <id>\` — Comprar item`,
          `\`${PREFIX}equipar <id>\` — Equipar item`,
          `\`${PREFIX}inventario\` — Ver inventário`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "👥 Social",
        value: [
          `\`${PREFIX}perfil [@user]\` — Ver perfil`,
          `\`${PREFIX}avatar [@user]\` — Ver avatar`,
          `\`${PREFIX}banner [@user]\` — Ver banner`,
          `\`${PREFIX}rep @user\` — Dar reputação (12h)`,
          `\`${PREFIX}afk [motivo]\` — Ativar/desativar AFK`,
          `\`${PREFIX}casar @user\` — Pedir em casamento`,
          `\`${PREFIX}beijar @user\` — Dar um beijo`,
          `\`${PREFIX}abracar @user\` — Dar um abraço`,
          `\`${PREFIX}socar @user\` — Socar alguém`,
          `\`${PREFIX}carinho @user\` — Fazer carinho`,
          `\`${PREFIX}chorar\` — Chorar`,
          `\`${PREFIX}morder @user\` — Morder alguém`,
          `\`${PREFIX}cutucar @user\` — Cutucar alguém`,
          `\`${PREFIX}dancar [@user]\` — Dançar 💃`,
          `\`${PREFIX}acenar [@user]\` — Acenar 👋`,
          `\`${PREFIX}rir [@user]\` — Rir 😂`,
          `\`${PREFIX}sorrir [@user]\` — Sorrir 😊`,
          `\`${PREFIX}dormir\` — Dormir 😴`,
          `\`${PREFIX}pensar\` — Pensar 🤔`,
          `\`${PREFIX}piscar @user\` — Piscar 😉`,
          `\`${PREFIX}chutar @user\` — Chutar 🦵`,
          `\`${PREFIX}highfive @user\` — High five 🙌`,
          `\`${PREFIX}nomnom [@user]\` — Nomnom 😋`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "🎮 Jogos",
        value: [
          `\`${PREFIX}slot <aposta>\` — Caça-níqueis`,
          `\`${PREFIX}blackjack <aposta>\` — Blackjack`,
          `\`${PREFIX}dados <aposta> [1-6]\` — Dados`,
          `\`${PREFIX}roleta <aposta> <cor/nº>\` — Roleta`,
          `\`${PREFIX}duelo @user [aposta]\` — Duelar`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "🎵 Música",
        value: [
          `\`${PREFIX}play <música>\` — Adicionar à fila`,
          `\`${PREFIX}skip\` — Pular música`,
          `\`${PREFIX}stop\` — Parar e limpar fila`,
          `\`${PREFIX}fila\` — Ver fila`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "📬 Tellonym",
        value: [
          `\`${PREFIX}tellonym @user <msg>\` — Enviar mensagem anônima (via texto)`,
          `\`${PREFIX}inbox\` — Ver caixa de entrada`,
          `> O painel interativo (botão) é criado pelo admin com \`${PREFIX}setar tellonym setup\``,
        ].join("\n"),
        inline: false,
      },
      {
        name: "🛡️ Admin",
        value: [
          `\`${PREFIX}dar @user <valor>\` — Dar/remover coins`,
          `\`${PREFIX}setar prefix <val>\` — Mudar prefixo`,
          `\`${PREFIX}setar tellonym #canal\` — Definir canal de tellonym`,
          `\`${PREFIX}setar tellonym setup [@user]\` — Criar painel com botão no canal`,
          `\`${PREFIX}setar tellonym banner <url>\` — Definir imagem do painel`,
          `\`${PREFIX}setar tellonym desativar\` — Desativar canal configurado`,
          `\`${PREFIX}resetar @user\` — Resetar economia`,
          `\`${PREFIX}anunciar <msg>\` — Fazer anúncio`,
        ].join("\n"),
        inline: false,
      },
    )
    .setFooter({ ...authorFooter(message), text: `Prefixo: ${PREFIX} • Suporte: /ajuda` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
