import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "kick",      verb: "chutou",           prep: "",     emoji: "🦵" });
