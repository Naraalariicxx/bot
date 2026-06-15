import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "kiss",      verb: "deu um beijo",     prep: "em",   emoji: "💋" });
