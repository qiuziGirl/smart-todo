import localforage from "localforage";

const outbox = localforage.createInstance({
  name: "smart-note",
  storeName: "note_outbox",
});

const OUTBOX_KEY = "pending_saves";

export type OutboxEntry = {
  noteId: string;
  /** Tiptap JSON 文档 */
  docJson: unknown;
  enqueuedAt: number;
};

async function readAll(): Promise<OutboxEntry[]> {
  const raw = await outbox.getItem<OutboxEntry[]>(OUTBOX_KEY);
  return Array.isArray(raw) ? raw : [];
}

async function writeAll(entries: OutboxEntry[]): Promise<void> {
  await outbox.setItem(OUTBOX_KEY, entries);
}

/** 入队：同一 noteId 只保留最后一次内容 */
export async function enqueueNoteSave(noteId: string, docJson: unknown): Promise<void> {
  const list = await readAll();
  const filtered = list.filter((e) => e.noteId !== noteId);
  filtered.push({ noteId, docJson, enqueuedAt: Date.now() });
  await writeAll(filtered);
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  return readAll();
}

export async function removeOutboxEntry(noteId: string): Promise<void> {
  const list = await readAll();
  await writeAll(list.filter((e) => e.noteId !== noteId));
}

type SaveAttemptResult =
  | { ok: true; syncVersion: number }
  | { error: string }
  | { conflict: true; serverSyncVersion: number };

/** 顺序重放队列（默认不校验 expectedSyncVersion，离线恢复以最后一次本地内容为准） */
export async function drainOutbox(
  saver: (noteId: string, docJson: unknown) => Promise<SaveAttemptResult>
): Promise<{ flushed: number; failed: number }> {
  let flushed = 0;
  let failed = 0;

  while (true) {
    const list = await readAll();
    if (list.length === 0) {
      break;
    }
    const entry = list[0];
    try {
      const res = await saver(entry.noteId, entry.docJson);
      if (res && "ok" in res && res.ok) {
        await removeOutboxEntry(entry.noteId);
        flushed += 1;
        continue;
      }
      if (res && "conflict" in res && res.conflict) {
        await removeOutboxEntry(entry.noteId);
        failed += 1;
        continue;
      }
      if (res && "error" in res && res.error) {
        failed += 1;
        break;
      }
      failed += 1;
      break;
    } catch {
      failed += 1;
      break;
    }
  }

  return { flushed, failed };
}
