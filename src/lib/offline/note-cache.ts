import localforage from "localforage";

const cache = localforage.createInstance({
  name: "smart-note",
  storeName: "note_cache",
});

export type NoteCachePayload = {
  contentJson: unknown;
  syncVersion: number;
  savedAt: number;
};

function key(noteId: string) {
  return `note:${noteId}`;
}

export async function writeNoteCache(noteId: string, payload: NoteCachePayload): Promise<void> {
  await cache.setItem(key(noteId), payload);
}

export async function readNoteCache(noteId: string): Promise<NoteCachePayload | null> {
  return (await cache.getItem<NoteCachePayload>(key(noteId))) ?? null;
}
