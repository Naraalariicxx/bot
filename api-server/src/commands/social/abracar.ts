import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "hug",       verb: "deu um abraço",    prep: "em",   emoji: "🤗" });
