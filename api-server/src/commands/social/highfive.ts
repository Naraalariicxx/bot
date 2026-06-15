import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "highfive",  verb: "deu um high five", prep: "para", emoji: "🙌" });
