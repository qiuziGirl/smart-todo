"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useGroupRef, type Layout } from "react-resizable-panels";

const STORAGE_KEY = "smart-note:notes-layout";
const PANEL_IDS = ["groups", "list", "editor"] as const;

interface NotesResizableLayoutProps {
  mobileAction: React.ReactNode;
  leftPanel: React.ReactNode;
  middlePanel: React.ReactNode;
  children: React.ReactNode;
}

function readStoredLayout(): Layout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      PANEL_IDS.every(
        (id) => typeof (parsed as Record<string, unknown>)[id] === "number",
      )
    ) {
      const record = parsed as Record<string, number>;
      // 仅提取当前已知面板的 key，避免遗留字段干扰
      return Object.fromEntries(
        PANEL_IDS.map((id) => [id, record[id]]),
      ) as Layout;
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

export function NotesResizableLayout({
  mobileAction,
  leftPanel,
  middlePanel,
  children,
}: NotesResizableLayoutProps) {
  const groupRef = useGroupRef();
  const saveTimerRef = useRef<number | null>(null);

  // Restore saved layout after mount (client-only)
  useEffect(() => {
    const layout = readStoredLayout();
    if (layout) {
      groupRef.current?.setLayout(layout);
    }
  }, [groupRef]);

  const handleLayoutChanged = useCallback((layout: Layout) => {
    if (typeof window === "undefined") return;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      } catch {
        // ignore quota / privacy mode errors
      }
    }, 300);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Mobile: vertical stacked layout */}
      <div className="flex flex-col md:hidden">
        {mobileAction}
        <aside className="flex w-full shrink-0 flex-col gap-2 border-b p-3">
          {leftPanel}
        </aside>
        <aside className="flex max-h-44 w-full shrink-0 flex-col border-b">
          {middlePanel}
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>

      {/*
        Desktop: resizable horizontal panels.
        NOTE: react-resizable-panels v4 forces inline `display: flex` on the
        Group element, so Tailwind classes like `hidden md:flex` cannot toggle
        it directly. We wrap the Group in a sibling div that owns the
        responsive visibility.
      */}
      <div className="hidden min-h-0 flex-1 md:block">
        <ResizablePanelGroup
          orientation="horizontal"
          groupRef={groupRef}
          onLayoutChanged={handleLayoutChanged}
        >
          {/*
            v4 breaking change: numeric size values are interpreted as PIXELS.
            String values (with or without "%") are treated as percentages.
            Use string percentages to get the intended 15 / 20 / 65 layout.
          */}
          <ResizablePanel
            id="groups"
            defaultSize="15%"
            minSize="12%"
            maxSize="25%"
          >
            <aside className="flex h-full flex-col gap-2 p-3">{leftPanel}</aside>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            id="list"
            defaultSize="20%"
            minSize="15%"
            maxSize="35%"
          >
            <aside className="flex h-full flex-col">{middlePanel}</aside>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel id="editor" defaultSize="65%" minSize="40%">
            <div className="flex h-full min-w-0 flex-col">{children}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
