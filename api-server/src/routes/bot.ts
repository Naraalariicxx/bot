let _tag = "";
let _startedAt = 0;

export function setBotInfo(tag: string, timestamp: number): void {
  _tag = tag;
  _startedAt = timestamp;
}

export function getBotInfo() {
  return { tag: _tag, startedAt: _startedAt, uptime: _startedAt ? Date.now() - _startedAt : 0 };
}
