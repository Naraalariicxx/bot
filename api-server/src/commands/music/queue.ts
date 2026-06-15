export interface Track {
  title: string;
  url: string;
  requestedBy: string;
}

const queues = new Map<string, Track[]>();

export function getQueue(guildId: string): Track[] {
  if (!queues.has(guildId)) queues.set(guildId, []);
  return queues.get(guildId)!;
}

export function addToQueue(guildId: string, track: Track): void {
  getQueue(guildId).push(track);
}

export function skipTrack(guildId: string): Track | undefined {
  const q = getQueue(guildId);
  return q.shift();
}

export function clearQueue(guildId: string): void {
  queues.delete(guildId);
}
