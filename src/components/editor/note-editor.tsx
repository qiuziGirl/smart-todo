"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import UniqueID from "@tiptap/extension-unique-id";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  Bold,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Pin,
  Redo2,
  Strikethrough,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  moveNoteToGroup,
  saveNoteFromEditor,
  setNoteColor,
  softDeleteNote,
  togglePinNote,
} from "@/actions/notes";
import { uploadNoteImage } from "@/actions/upload";
import { NOTE_COLORS } from "@/lib/constants";
import type { GroupListItem } from "@/types/note";
import { CustomTaskItem } from "@/lib/tiptap/custom-task-item";
import { enqueueNoteSave } from "@/lib/offline/note-outbox";
import { writeNoteCache } from "@/lib/offline/note-cache";

const DEBOUNCE_MS = 650;

function isLikelyNetworkError(e: unknown): boolean {
  if (!(e instanceof Error)) {
    return false;
  }
  const m = e.message.toLowerCase();
  return (
    m.includes("fetch") ||
    m.includes("network") ||
    m.includes("failed to fetch") ||
    e.name === "TypeError"
  );
}

function formatForDatetimeLocal(iso: string | undefined): string {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type NoteEditorProps = {
  noteId: string;
  initialContent: object;
  initialPinned: boolean;
  initialColor: string | null;
  initialGroupId: string | null;
  groups: GroupListItem[];
  /** 从 `/todos` 跳转时用于滚动到对应 taskItem（依赖 UniqueID 的 `data-id`） */
  anchorBlockId?: string | null;
  /** 服务端 `notes.sync_version`，用于并发保存与 Realtime 刷新检测 */
  serverSyncVersion: number;
};

export function NoteEditor({
  noteId,
  initialContent,
  initialPinned,
  initialColor,
  initialGroupId,
  groups,
  anchorBlockId = null,
  serverSyncVersion,
}: NoteEditorProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pinned, setPinned] = useState(initialPinned);
  const [color, setColor] = useState<string | null>(initialColor);
  const [groupId, setGroupId] = useState<string | null>(initialGroupId);
  const [lastSavedSyncVersion, setLastSavedSyncVersion] = useState(serverSyncVersion);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirtySinceSaveRef = useRef(false);
  const warnedRemoteRev = useRef<number | null>(null);
  const prevNoteIdRef = useRef(noteId);
  const flushSaveRef = useRef<(json: unknown) => Promise<void>>(async () => {});

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      TaskList,
      CustomTaskItem.configure({ nested: true }),
      UniqueID.configure({
        types: ["taskItem"],
        attributeName: "id",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "开始书写…支持 Markdown 习惯与待办列表。" }),
      Typography,
    ],
    []
  );

  const flushSave = useCallback(
    async (json: unknown) => {
      setSaveState("saving");
      let res: Awaited<ReturnType<typeof saveNoteFromEditor>>;
      try {
        res = await saveNoteFromEditor(noteId, json, {
          expectedSyncVersion: lastSavedSyncVersion,
        });
      } catch (e) {
        if (isLikelyNetworkError(e)) {
          await enqueueNoteSave(noteId, json);
          setSaveState("error");
          toast.warning("网络不可用，内容已加入本地队列，联网后将自动上传");
          return;
        }
        setSaveState("error");
        toast.error("保存失败");
        return;
      }
      if ("conflict" in res && res.conflict) {
        setSaveState("error");
        toast.error("保存冲突：便签已在其他端更新", {
          action: {
            label: "重新加载",
            onClick: () => router.refresh(),
          },
        });
        return;
      }
      if ("error" in res && res.error) {
        setSaveState("error");
        toast.error(res.error);
        return;
      }
      if ("ok" in res && res.ok) {
        setLastSavedSyncVersion(res.syncVersion);
        dirtySinceSaveRef.current = false;
        try {
          await writeNoteCache(noteId, {
            contentJson: json,
            syncVersion: res.syncVersion,
            savedAt: Date.now(),
          });
        } catch {
          /* ignore cache write errors */
        }
        setSaveState("saved");
        router.refresh();
      }
    },
    [noteId, router, lastSavedSyncVersion]
  );

  useEffect(() => {
    flushSaveRef.current = flushSave;
  }, [flushSave]);

  const scheduleSave = useCallback((json: unknown) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushSaveRef.current(json);
    }, DEBOUNCE_MS);
  }, []);

  const editor = useEditor({
    extensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[50vh] max-w-none px-4 py-3 text-sm leading-relaxed outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed, transaction }) => {
      if (transaction.docChanged) {
        dirtySinceSaveRef.current = true;
      }
      scheduleSave(ed.getJSON());
    },
    onBlur: ({ editor: ed }) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      void flushSaveRef.current(ed.getJSON());
    },
  });

  useEffect(() => {
    if (prevNoteIdRef.current !== noteId) {
      prevNoteIdRef.current = noteId;
      setLastSavedSyncVersion(serverSyncVersion);
      dirtySinceSaveRef.current = false;
      warnedRemoteRev.current = null;
    }
  }, [noteId, serverSyncVersion]);

  useEffect(() => {
    if (serverSyncVersion <= lastSavedSyncVersion) {
      return;
    }
    if (!editor || editor.isDestroyed) {
      return;
    }
    if (!dirtySinceSaveRef.current) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
      setLastSavedSyncVersion(serverSyncVersion);
      warnedRemoteRev.current = null;
      return;
    }
    if (warnedRemoteRev.current !== serverSyncVersion) {
      warnedRemoteRev.current = serverSyncVersion;
      toast.info("便签已在其他端更新", {
        action: {
          label: "载入最新",
          onClick: () => {
            editor.commands.setContent(initialContent, { emitUpdate: false });
            setLastSavedSyncVersion(serverSyncVersion);
            dirtySinceSaveRef.current = false;
            router.refresh();
          },
        },
      });
    }
  }, [serverSyncVersion, lastSavedSyncVersion, initialContent, editor, router]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom as HTMLElement;
    const ed = editor;

    async function onPasteCapture(e: ClipboardEvent) {
      const items = e.clipboardData?.files;
      if (!items?.length) return;
      const img = Array.from(items).find((f) => f.type.startsWith("image/"));
      if (!img) return;
      e.preventDefault();
      e.stopPropagation();
      const fd = new FormData();
      fd.append("file", img);
      const r = await uploadNoteImage(fd);
      if ("error" in r && r.error) {
        setSaveState("error");
        return;
      }
      if ("url" in r && r.url) {
        ed.chain().focus().setImage({ src: r.url }).run();
      }
    }

    dom.addEventListener("paste", onPasteCapture, true);
    return () => dom.removeEventListener("paste", onPasteCapture, true);
  }, [editor]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editor || !anchorBlockId) {
      return;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const root = editor.view.dom as HTMLElement;
        const sel = `[data-id="${CSS.escape(anchorBlockId)}"]`;
        const el = root.querySelector(sel);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [editor, anchorBlockId]);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ed = editor;
    if (!ed) return;
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadNoteImage(fd);
    if ("error" in r && r.error) {
      setSaveState("error");
      return;
    }
    if ("url" in r && r.url) {
      ed.chain().focus().setImage({ src: r.url }).run();
    }
  }

  function onSetLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function onTogglePin() {
    const next = !pinned;
    setPinned(next);
    start(async () => {
      await togglePinNote(noteId, next);
      router.refresh();
    });
  }

  async function onColorChange(c: string) {
    setColor(c || null);
    start(async () => {
      await setNoteColor(noteId, c || null);
      router.refresh();
    });
  }

  async function onGroupChange(gid: string) {
    const next = gid === "" ? null : gid;
    setGroupId(next);
    start(async () => {
      await moveNoteToGroup(noteId, next);
      router.refresh();
    });
  }

  async function onDelete() {
    if (!confirm("将便签移入回收站？")) return;
    start(async () => {
      await softDeleteNote(noteId);
    });
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col border-l bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="加粗"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="斜体"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="删除线"
        >
          <Strikethrough className="size-4" />
        </Button>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="sm"
          className="px-2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="无序列表"
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="有序列表"
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("taskList") ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          aria-label="待办列表"
        >
          <ListTodo className="size-4" />
        </Button>
        {editor.isActive("taskItem") && (
          <>
            <Separator orientation="vertical" className="mx-0.5 h-6" />
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              到期
              <input
                type="date"
                className="h-7 max-w-[132px] rounded border bg-background px-1 text-sm"
                value={(() => {
                  const v = editor.getAttributes("taskItem").dueAt as string | undefined;
                  return v ? v.slice(0, 10) : "";
                })()}
                onChange={(e) => {
                  const v = e.target.value;
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("taskItem", {
                      dueAt: v ? `${v}T12:00:00.000Z` : null,
                    })
                    .run();
                }}
              />
            </label>
            <label className="flex max-w-[200px] items-center gap-1 text-sm text-muted-foreground sm:max-w-none">
              提醒
              <input
                type="datetime-local"
                className="h-7 max-w-[165px] rounded border bg-background px-1 text-sm"
                value={formatForDatetimeLocal(editor.getAttributes("taskItem").remindAt as string | undefined)}
                onChange={(e) => {
                  const v = e.target.value;
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("taskItem", {
                      remindAt: v ? new Date(v).toISOString() : null,
                    })
                    .run();
                }}
              />
            </label>
          </>
        )}
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Button type="button" variant="ghost" size="icon-sm" onClick={onSetLink} aria-label="链接">
          <LinkIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => fileRef.current?.click()}
          aria-label="插入图片"
        >
          <ImageIcon className="size-4" />
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </Button>
        <div className="flex-1" />
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {saveState === "saving" && "保存中…"}
          {saveState === "saved" && "已保存"}
          {saveState === "error" && "保存失败"}
          {saveState === "idle" && ""}
        </span>
        <Button
          type="button"
          variant={pinned ? "secondary" : "ghost"}
          size="icon-sm"
          disabled={pending}
          onClick={() => void onTogglePin()}
          aria-label="置顶"
        >
          <Pin className="size-4" />
        </Button>
        <select
          className="h-8 max-w-[100px] rounded-md border bg-background px-1 text-sm sm:max-w-[120px]"
          value={color ?? ""}
          disabled={pending}
          onChange={(e) => void onColorChange(e.target.value)}
          aria-label="颜色"
        >
          <option value="">无颜色</option>
          {NOTE_COLORS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="h-8 max-w-[120px] rounded-md border bg-background px-1 text-sm"
          value={groupId ?? ""}
          disabled={pending}
          onChange={(e) => void onGroupChange(e.target.value)}
          aria-label="分组"
        >
          <option value="">未分组</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void onDelete()}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="flex-1 overflow-auto" />
    </div>
  );
}
