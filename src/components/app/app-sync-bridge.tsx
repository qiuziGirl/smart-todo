"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { drainOutbox } from "@/lib/offline/note-outbox";
import { readNoteCache } from "@/lib/offline/note-cache";
import { saveNoteFromEditor } from "@/actions/notes";

const REFRESH_DEBOUNCE_MS = 900;

type AppSyncBridgeProps = {
  userId: string;
};

/**
 * 登录后 (app) 壳内：订阅 Supabase Realtime（notes / groups / todo_items），防抖触发 router.refresh；
 * 并在联网时尝试刷出本地 outbox 队列。
 */
export function AppSyncBridge({ userId }: AppSyncBridgeProps) {
  const router = useRouter();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    scheduleRefreshRef.current = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    };
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `app-data-${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          scheduleRefreshRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "groups",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          scheduleRefreshRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todo_items",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          scheduleRefreshRef.current();
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" && err) {
          console.warn("[realtime]", status, err);
        }
      });

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    async function onOnline() {
      const { flushed, failed, discarded } = await drainOutbox(
        async (noteId, docJson) => {
          return saveNoteFromEditor(noteId, JSON.stringify(docJson), { skipExpectedVersion: true });
        },
        {
          shouldDiscard: async (entry) => {
            const cache = await readNoteCache(entry.noteId);
            if (!cache) {
              return false;
            }
            // 本地已存在更晚的已保存版本，离线草稿条目过期，丢弃防止 LWW 反向覆盖。
            return cache.savedAt > entry.enqueuedAt;
          },
        }
      );
      if (flushed > 0) {
        toast.success(`已同步 ${flushed} 条离线草稿`);
        router.refresh();
      }
      if (discarded > 0) {
        toast.message(`已丢弃 ${discarded} 条过期离线草稿`);
      }
      if (failed > 0) {
        toast.message(`有 ${failed} 条草稿仍未能上传（可能与其他端冲突）`);
      }
    }

    window.addEventListener("online", onOnline);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void onOnline();
    }
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [router]);

  return null;
}
