import { Client, GatewayIntentBits, Events, Interaction } from "discord.js";
import { db, usersTable, commandLogsTable, guildSettingsTable, duelsTable, tellonymTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";
import { setBotInfo } from "../routes/bot.js";

// ── Command imports ─────────────────────────────────────────────────────────
import saldo from "../commands/economy/saldo.js";
import daily from "../commands/economy/daily.js";
import trabalhar from "../commands/economy/trabalhar.js";
import apostar from "../commands/economy/apostar.js";
import transferir from "../commands/economy/transferir.js";
import ranking from "../commands/economy/ranking.js";
import loja from "../commands/economy/loja.js";
import comprar from "../commands/economy/comprar.js";
import equipar from "../commands/economy/equipar.js";
import inventario from "../commands/economy/inventario.js";

import avatar from "../commands/social/avatar.js";
import banner from "../commands/social/banner.js";
import afk, { checkAfk } from "../commands/social/afk.js";
import perfil from "../commands/social/perfil.js";
import rep from "../commands/social/rep.js";
import casar from "../commands/social/casar.js";
import { beijar, abracar, socar, carinho, chorar, morder, cutucar } from "../commands/social/gif.js";
import dancar from "../commands/social/dancar.js";
import acenar from "../commands/social/acenar.js";
import rir from "../commands/social/rir.js";
import sorrir from "../commands/social/sorrir.js";
import dormir from "../commands/social/dormir.js";
import pensar from "../commands/social/pensar.js";
import piscar from "../commands/social/piscar.js";
import chutar from "../commands/social/chutar.js";
import highfive from "../commands/social/highfive.js";
import nomnom from "../commands/social/nomnom.js";

import slot from "../commands/games/slot.js";
import blackjack from "../commands/games/blackjack.js";
import dados from "../commands/games/dados.js";
import roleta from "../commands/games/roleta.js";

import play from "../commands/music/play.js";
import skip from "../commands/music/skip.js";
import stop from "../commands/music/stop.js";
import fila from "../commands/music/fila.js";

import ajuda from "../commands/ajuda.js";
import dar from "../commands/admin/dar.js";
import setar from "../commands/admin/setar.js";
import resetar from "../commands/admin/resetar.js";
import anunciar from "../commands/admin/anunciar.js";

import duelo from "../commands/games/duelo.js";

// ── Tellonym (inline) ────────────────────────────────────────────────────────
import { handleTellonym, handleInbox, buildTellonymModal, processTellonymModal, processTellonymApprove, processTellonymReject } from "./bot-features.js";

// ── Aliases multilíngues → comando canônico ─────────────────────────────────
const ALIASES: Record<string, string> = {
  // saldo
  saldo:"saldo", balance:"saldo", bal:"saldo", money:"saldo", coins:"saldo",
  wallet:"saldo", carteira:"saldo", guthaben:"saldo", solde:"saldo",
  dinero:"saldo", monedas:"saldo", geld:"saldo", denaro:"saldo",
  "残高":"saldo", "잔액":"saldo", "余额":"saldo",
  // daily
  daily:"daily", diario:"daily", "diário":"daily", claim:"daily", collect:"daily",
  coletar:"daily", quotidien:"daily", "täglich":"daily", giornaliero:"daily",
  "ежедневно":"daily", "毎日":"daily", "일일":"daily", "每日":"daily", recompensa:"daily",
  // trabalhar
  trabalhar:"trabalhar", work:"trabalhar", travailler:"trabalhar", arbeiten:"trabalhar",
  trabajar:"trabalhar", lavorare:"trabalhar", job:"trabalhar", earn:"trabalhar",
  ganhar:"trabalhar", "働く":"trabalhar", "일하다":"trabalhar", "工作":"trabalhar",
  // apostar
  apostar:"apostar", bet:"apostar", parier:"apostar", wetten:"apostar", gamble:"apostar",
  jogo:"apostar", jugar:"apostar", jouer:"apostar", spielen:"apostar",
  "ставка":"apostar", "ベット":"apostar", "赌":"apostar", "배팅":"apostar",
  // transferir
  transferir:"transferir", transfer:"transferir", pay:"transferir", send:"transferir",
  pagar:"transferir", envoyer:"transferir", "überweisen":"transferir", pagare:"transferir",
  "перевести":"transferir", "送金":"transferir", "보내다":"transferir", "转账":"transferir",
  // ranking
  ranking:"ranking", rank:"ranking", top:"ranking", leaderboard:"ranking", lb:"ranking",
  rich:"ranking", richest:"ranking", "classificação":"ranking", clasificacion:"ranking",
  classement:"ranking", rangliste:"ranking", "рейтинг":"ranking",
  "ランキング":"ranking", "순위":"ranking", "排名":"ranking",
  // loja
  loja:"loja", shop:"loja", store:"loja", boutique:"loja", tienda:"loja",
  negozio:"loja", laden:"loja", "магазин":"loja", "ショップ":"loja", "상점":"loja",
  "商店":"loja", mercado:"loja",
  // comprar
  comprar:"comprar", buy:"comprar", purchase:"comprar", acheter:"comprar",
  kaufen:"comprar", comprare:"comprar", "купить":"comprar", "購入":"comprar",
  "구매":"comprar", "购买":"comprar",
  // equipar
  equipar:"equipar", equip:"equipar", wear:"equipar", usar:"equipar",
  "装備":"equipar", "장착":"equipar", "装备":"equipar",
  // inventario
  inventario:"inventario", inventory:"inventario", inv:"inventario", bag:"inventario",
  backpack:"inventario", mochila:"inventario", inventaire:"inventario",
  "インベントリ":"inventario", "인벤토리":"inventario", "背包":"inventario",
  // perfil
  perfil:"perfil", profile:"perfil", card:"perfil", profil:"perfil", profilo:"perfil",
  "профиль":"perfil", "プロフィール":"perfil", "프로필":"perfil", "资料":"perfil", me:"perfil",
  // avatar
  avatar:"avatar", pfp:"avatar", photo:"avatar", foto:"avatar", picture:"avatar",
  "アバター":"avatar", "아바타":"avatar", "头像":"avatar", "аватар":"avatar",
  // banner
  banner:"banner", "バナー":"banner", "배너":"banner", "横幅":"banner", "баннер":"banner",
  // rep
  rep:"rep", reputation:"rep", reputacao:"rep", "reputação":"rep",
  "reputación":"rep", "réputation":"rep", ruf:"rep", "репутация":"rep",
  "評判":"rep", "명성":"rep", "声誉":"rep",
  // afk
  afk:"afk", away:"afk", ausente:"afk", absent:"afk", inaktiv:"afk", "占位":"afk",
  // beijar
  beijar:"beijar", kiss:"beijar", kyss:"beijar", beso:"beijar", baiser:"beijar",
  "küssen":"beijar", bacio:"beijar", "поцеловать":"beijar", "キス":"beijar",
  "키스":"beijar", "亲吻":"beijar",
  // abracar
  abracar:"abracar", "abraçar":"abracar", hug:"abracar", "câlin":"abracar",
  umarmen:"abracar", abbracciare:"abracar", "обнять":"abracar",
  "ハグ":"abracar", "포옹":"abracar", "拥抱":"abracar",
  // carinho
  carinho:"carinho", pat:"carinho", caress:"carinho", streicheln:"carinho",
  accarezzare:"carinho", "погладить":"carinho", "なでる":"carinho",
  "쓰다듬다":"carinho", "抚摸":"carinho",
  // socar
  socar:"socar", punch:"socar", hit:"socar", golpear:"socar", schlagen:"socar",
  colpire:"socar", "ударить":"socar", "パンチ":"socar", "펀치":"socar", "打拳":"socar",
  // morder
  morder:"morder", bite:"morder", "beißen":"morder", mordre:"morder",
  mordere:"morder", "укусить":"morder", "噛む":"morder", "물다":"morder", "咬":"morder",
  // cutucar
  cutucar:"cutucar", poke:"cutucar", prod:"cutucar", stupire:"cutucar",
  "ツンツン":"cutucar", "찌르다":"cutucar", "戳":"cutucar",
  // dancar
  dancar:"dancar", "dançar":"dancar", dance:"dancar", danse:"dancar",
  "tanzen":"dancar", danzare:"dancar", "танцевать":"dancar", "踊る":"dancar",
  "춤추다":"dancar", "跳舞":"dancar",
  // acenar
  acenar:"acenar", wave:"acenar", agitar:"acenar",
  "あいさつ":"acenar", "손흔들기":"acenar", "挥手":"acenar",
  // rir
  rir:"rir", laugh:"rir", lol:"rir", haha:"rir", rire:"rir", lachen:"rir",
  ridere:"rir", "笑う":"rir", "웃다":"rir", "笑":"rir",
  // sorrir
  sorrir:"sorrir", smile:"sorrir", sourire:"sorrir", lächeln:"sorrir",
  sorridere:"sorrir", "улыбаться":"sorrir", "ほほえむ":"sorrir", "미소":"sorrir", "微笑":"sorrir",
  // dormir
  dormir:"dormir", sleep:"dormir", "schlafen":"dormir", slumber:"dormir",
  "眠る":"dormir", "자다":"dormir", "睡觉":"dormir",
  // pensar
  pensar:"pensar", think:"pensar", "penser":"pensar", "denken":"pensar",
  "pensare":"pensar", "思う":"pensar", "생각하다":"pensar", "思考":"pensar",
  // piscar
  piscar:"piscar", wink:"piscar", "blinzeln":"piscar", "cligner":"piscar",
  "まばたき":"piscar", "윙크":"piscar", "眨眼":"piscar",
  // chutar
  chutar:"chutar", kick:"chutar", "treten":"chutar", "donner un coup":"chutar",
  "蹴る":"chutar", "차다":"chutar", "踢":"chutar",
  // highfive
  highfive:"highfive", "high5":"highfive", "high-five":"highfive", "hi5":"highfive",
  "ハイタッチ":"highfive", "하이파이브":"highfive", "击掌":"highfive",
  // nomnom
  nomnom:"nomnom", nom:"nomnom", eat:"nomnom", comer:"nomnom", manger:"nomnom",
  "essen":"nomnom", mangiare:"nomnom", "食べる":"nomnom", "먹다":"nomnom", "吃":"nomnom",
  // chorar
  chorar:"chorar", cry:"chorar", weep:"chorar", pleurer:"chorar", weinen:"chorar",
  piangere:"chorar", "плакать":"chorar", "泣く":"chorar", "울다":"chorar", "哭":"chorar",
  // casar
  casar:"casar", marry:"casar", wedding:"casar", heiraten:"casar", marier:"casar",
  sposare:"casar", "жениться":"casar", "結婚":"casar", "결혼":"casar",
  "结婚":"casar", casarse:"casar",
  // slot
  slot:"slot", slots:"slot", cacaniqueis:"slot", "caça_níqueis":"slot", machine:"slot",
  spielautomat:"slot", "スロット":"slot", "슬롯":"slot", "老虎机":"slot",
  // blackjack
  blackjack:"blackjack", bj:"blackjack", "21":"blackjack", vingtun:"blackjack",
  veintiuno:"blackjack", "ブラックジャック":"blackjack", "블랙잭":"blackjack", "二十一点":"blackjack",
  // dados
  dados:"dados", dice:"dados", "dés":"dados", "würfel":"dados", dado:"dados",
  dadi:"dados", "кости":"dados", "サイコロ":"dados", "주사위":"dados", "骰子":"dados",
  // roleta
  roleta:"roleta", roulette:"roleta", ruleta:"roleta", "ルーレット":"roleta",
  "룰렛":"roleta", "轮盘":"roleta",
  // duelo
  duelo:"duelo", duel:"duelo", batalha:"duelo", battle:"duelo", duell:"duelo",
  "デュエル":"duelo", "决斗":"duelo", "결투":"duelo",
  // tellonym
  tellonym:"tellonym", anon:"tellonym", anonimo:"tellonym", "anônimo":"tellonym",
  // inbox
  inbox:"inbox", caixa:"inbox", mensagens:"inbox",
  // play
  play:"play", tocar:"play", musica:"play", music:"play", "再生":"play", "재생":"play",
  "播放":"play", "музыка":"play",
  // skip
  skip:"skip", pular:"skip", sauter:"skip", next:"skip", "スキップ":"skip",
  "스킵":"skip", "跳过":"skip",
  // stop
  stop:"stop", parar:"stop", leave:"stop", sair:"stop", "停止":"stop",
  // fila
  fila:"fila", queue:"fila", q:"fila", "キュー":"fila", "대기열":"fila", "队列":"fila",
  // ajuda
  ajuda:"ajuda", help:"ajuda", comandos:"ajuda", aide:"ajuda", hilfe:"ajuda",
  aiuto:"ajuda", "помощь":"ajuda", "ヘルプ":"ajuda", "도움말":"ajuda", "帮助":"ajuda", ayuda:"ajuda",
  // dar
  dar:"dar", give:"dar", geben:"dar", donner:"dar", dare:"dar",
  "дать":"dar", "あげる":"dar", "주다":"dar", "给予":"dar", add:"dar",
  // setar
  setar:"setar", set:"setar", setzen:"setar", "définir":"setar", impostare:"setar",
  "установить":"setar", "設定":"setar", "설정":"setar", "设置":"setar",
  // resetar
  resetar:"resetar", reset:"resetar", "zurücksetzen":"resetar",
  "réinitialiser":"resetar", ripristinare:"resetar", "сбросить":"resetar",
  "リセット":"resetar", "초기화":"resetar", "重置":"resetar",
  // anunciar
  anunciar:"anunciar", announce:"anunciar", broadcast:"anunciar",
  "발표":"anunciar", "宣布":"anunciar",
};

const PREFIX = "l";
let client: Client | null = null;

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    logger.warn("DISCORD_TOKEN not set — Discord bot will not start");
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  client.once(Events.ClientReady, async (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot is online");
    setBotInfo(c.user.tag, Date.now());
    c.user.setActivity("l ajuda | economy & games", { type: 3 });

    for (const [, guild] of c.guilds.cache) {
      await db
        .insert(guildSettingsTable)
        .values({ id: guild.id, name: guild.name, iconUrl: guild.iconURL() ?? null, memberCount: guild.memberCount, prefix: PREFIX })
        .onConflictDoUpdate({
          target: guildSettingsTable.id,
          set: { name: guild.name, iconUrl: guild.iconURL() ?? null, memberCount: guild.memberCount },
        });
    }
  });

  client.on(Events.GuildCreate, async (guild) => {
    await db
      .insert(guildSettingsTable)
      .values({ id: guild.id, name: guild.name, iconUrl: guild.iconURL() ?? null, memberCount: guild.memberCount, prefix: PREFIX })
      .onConflictDoUpdate({
        target: guildSettingsTable.id,
        set: { name: guild.name, iconUrl: guild.iconURL() ?? null, memberCount: guild.memberCount },
      });
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    // AFK check for all messages
    await checkAfk(message).catch(() => null);

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const raw = args.shift()?.toLowerCase();
    if (!raw) return;
    const cmd = ALIASES[raw] ?? raw;

    // Upsert user & log command
    const u = message.author;
    await ensureUser(u.id, u.username, u.discriminator, u.displayAvatarURL(), message.guild.id);
    await logCommand(u.id, u.username, cmd, message.guild.id, message.guild.name);

    try {
      switch (cmd) {
        // Economy
        case "saldo":      return void await saldo(message, args);
        case "daily":      return void await daily(message);
        case "trabalhar":  return void await trabalhar(message);
        case "apostar":    return void await apostar(message, args);
        case "transferir": return void await transferir(message, args);
        case "ranking":    return void await ranking(message);
        case "loja":       return void await loja(message, args);
        case "comprar":    return void await comprar(message, args);
        case "equipar":    return void await equipar(message, args);
        case "inventario": return void await inventario(message);
        // Social
        case "avatar":     return void await avatar(message);
        case "banner":     return void await banner(message);
        case "afk":        return void await afk(message, args);
        case "perfil":     return void await perfil(message);
        case "rep":        return void await rep(message);
        case "casar":      return void await casar(message, args);
        case "beijar":     return void await beijar(message);
        case "abracar":    return void await abracar(message);
        case "socar":      return void await socar(message);
        case "carinho":    return void await carinho(message);
        case "chorar":     return void await chorar(message);
        case "morder":     return void await morder(message);
        case "cutucar":    return void await cutucar(message);
        case "dancar":     return void await dancar(message);
        case "acenar":     return void await acenar(message);
        case "rir":        return void await rir(message);
        case "sorrir":     return void await sorrir(message);
        case "dormir":     return void await dormir(message);
        case "pensar":     return void await pensar(message);
        case "piscar":     return void await piscar(message);
        case "chutar":     return void await chutar(message);
        case "highfive":   return void await highfive(message);
        case "nomnom":     return void await nomnom(message);
        // Games
        case "slot":       return void await slot(message, args);
        case "blackjack":  return void await blackjack(message, args);
        case "dados":      return void await dados(message, args);
        case "roleta":     return void await roleta(message, args);
        case "duelo":      return void await duelo(message, args);
        // Music
        case "play":       return void await play(message, args);
        case "skip":       return void await skip(message);
        case "stop":       return void await stop(message);
        case "fila":       return void await fila(message);
        // Tellonym
        case "tellonym":   return void await handleTellonym(message, args);
        case "inbox":      return void await handleInbox(message);
        // Admin
        case "dar":        return void await dar(message, args);
        case "setar":      return void await setar(message, args);
        case "resetar":    return void await resetar(message, args);
        case "anunciar":   return void await anunciar(message, args);
        // Help
        case "ajuda":      return void await ajuda(message);
      }
    } catch (err) {
      logger.error({ err, cmd }, "Command error");
      try { await message.reply("❌ Ocorreu um erro ao executar o comando."); } catch { /* ignore */ }
    }
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("tellonym_send_")) {
          const targetUserId = interaction.customId.replace("tellonym_send_", "");
          await interaction.showModal(buildTellonymModal(targetUserId));
          return;
        }
        if (interaction.customId.startsWith("tellonym_approve_")) {
          await processTellonymApprove(interaction);
          return;
        }
        if (interaction.customId.startsWith("tellonym_reject_")) {
          await processTellonymReject(interaction);
          return;
        }
      }
      if (interaction.isModalSubmit() && interaction.customId.startsWith("tellonym_modal_")) {
        await processTellonymModal(interaction);
        return;
      }
    } catch (err) {
      logger.error({ err }, "Interaction error");
    }
  });

  try {
    await client.login(token);
  } catch (err) {
    logger.error({ err }, "Failed to login Discord bot");
  }
}

async function ensureUser(userId: string, username: string, discriminator: string, avatarUrl: string, guildId: string): Promise<void> {
  try {
    await db
      .insert(usersTable)
      .values({ id: userId, username, discriminator, avatarUrl, guildId })
      .onConflictDoUpdate({ target: usersTable.id, set: { username, discriminator, avatarUrl } });
  } catch (err) {
    logger.error({ err }, "Failed to upsert user");
  }
}

async function logCommand(userId: string, username: string, command: string, guildId: string, guildName: string): Promise<void> {
  try {
    await db.insert(commandLogsTable).values({ userId, username, command, guildId, guildName, success: 1 });
  } catch (err) {
    logger.error({ err }, "Failed to log command");
  }
}

export function getClient(): Client | null {
  return client;
}
