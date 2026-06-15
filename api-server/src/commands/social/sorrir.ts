import { Message } from "discord.js";
import { gifAction } from "./_gif.js";
export default (msg: Message) => gifAction(msg, { category: "smile",     verb: "sorriu",           prep: "para", emoji: "😊" });
