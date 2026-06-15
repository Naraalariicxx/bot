import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "cry",       verb: "está chorando",    prep: "",     emoji: "😭" });
