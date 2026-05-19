"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useGroupRef, usePanelRef, type Layout } from "react-resizable-panels";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "smart-note:notes-layout";
const PANEL_IDS = ["groups", "list", "editor"] as const;

interface ExpandedWidths {
  groups: number;
  list: number;
  editor: number;
}

interface StoredState extends ExpandedWidths {
  collapsed?: { groups?: boolean; list?: boolean };
}

function readStoredState(): StoredState | null {
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
      const record = parsed as Record<string, unknown>;
      const state: StoredState = {
        groups: record.groups as number,
        list: record.list as number,
        editor: record.editor as number,
      };
      if (record.collapsed && typeof record.collapsed === "object") {
        const c = record.collapsed as Record<string, unknown>;
        state.collapsed = {
          groups: c.groups === true,
          list: c.list === true,
        };
      }
      return state;
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

interface NotesResizableLayoutProps {
  mobileAction: React.ReactNode;
  leftPanel: React.ReactNode;
  middlePanel: React.ReactNode;
  children: React.ReactNode;
}

export function NotesResizableLayout({
  mobileAction,
  leftPanel,
  middlePanel,
  children,
}: NotesResizableLayoutProps) {
  const groupRef = useGroupRef();
  const groupsPanelRef = usePanelRef();
  const listPanelRef = usePanelRef();
  const saveTimerRef = useRef<number | null>(null);
  const lastExpandedWidthsRef = useRef<ExpandedWidths>({
    groups: 15,
    list: 20,
    editor: 65,
  });
  const [groupsCollapsed, setGroupsCollapsed] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [mobileGroupsOpen, setMobileGroupsOpen] = useState(true);

  // Restore saved layout + collapsed state after mount (client-only)
  useEffect(() => {
    const state = readStoredState();
    if (!state) return;
    lastExpandedWidthsRef.current = {
      groups: state.groups,
      list: state.list,
      editor: state.editor,
    };
    const layout: Layout = {
      groups: state.groups,
      list: state.list,
      editor: state.editor,
    };
    groupRef.current?.setLayout(layout);
    // Collapse panels that should be collapsed (after layout is applied)
    requestAnimationFrame(() => {
      if (state.collapsed?.groups) {
        groupsPanelRef.current?.collapse();
        setGroupsCollapsed(true);
      }
      if (state.collapsed?.list) {
        listPanelRef.current?.collapse();
        setListCollapsed(true);
      }
    });
  }, [groupRef, groupsPanelRef, listPanelRef]);

  const persistState = useCallback(
    (widths: ExpandedWidths, collapsed: { groups: boolean; list: boolean }) => {
      if (typeof window === "undefined") return;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        try {
          const stored: StoredState = { ...widths, collapsed };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        } catch {
          // ignore quota / privacy mode errors
        }
      }, 300);
    },
    [],
  );

  const handleLayoutChanged = useCallback(
    (layout: Layout) => {
      // Only update expanded widths when the panel is not collapsed (skip near-zero values)
      if ((layout.groups ?? 0) > 1)
        lastExpandedWidthsRef.current.groups = layout.groups;
      if ((layout.list ?? 0) > 1)
        lastExpandedWidthsRef.current.list = layout.list;
      if ((layout.editor ?? 0) > 1)
        lastExpandedWidthsRef.current.editor = layout.editor;
      persistState(lastExpandedWidthsRef.current, {
        groups: groupsPanelRef.current?.isCollapsed() ?? false,
        list: listPanelRef.current?.isCollapsed() ?? false,
      });
    },
    [groupsPanelRef, listPanelRef, persistState],
  );

  const toggleGroups = useCallback(() => {
    const panel = groupsPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      setGroupsCollapsed(false);
      persistState(lastExpandedWidthsRef.current, {
        groups: false,
        list: listPanelRef.current?.isCollapsed() ?? false,
      });
    } else {
      panel.collapse();
      setGroupsCollapsed(true);
      persistState(lastExpandedWidthsRef.current, {
        groups: true,
        list: listPanelRef.current?.isCollapsed() ?? false,
      });
    }
  }, [groupsPanelRef, listPanelRef, persistState]);

  const toggleList = useCallback(() => {
    const panel = listPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      setListCollapsed(false);
      persistState(lastExpandedWidthsRef.current, {
        groups: groupsPanelRef.current?.isCollapsed() ?? false,
        list: false,
      });
    } else {
      panel.collapse();
      setListCollapsed(true);
      persistState(lastExpandedWidthsRef.current, {
        groups: groupsPanelRef.current?.isCollapsed() ?? false,
        list: true,
      });
    }
  }, [groupsPanelRef, listPanelRef, persistState]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Mobile: vertical stacked layout */}
      <div className="flex flex-col md:hidden">
        {mobileAction}
        {/* Mobile groups section with toggle */}
        <div className="border-b">
          <button
            type="button"
            onClick={() => setMobileGroupsOpen((v) => !v)}
            className="flex w-full items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
            aria-expanded={mobileGroupsOpen}
          >
            {mobileGroupsOpen ? (
              <ChevronUp className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronDown className="h-3 w-3 shrink-0" />
            )}
            分组
          </button>
          {mobileGroupsOpen && (
            <aside className="flex w-full shrink-0 flex-col gap-2 p-3">
              {leftPanel}
            </aside>
          )}
        </div>
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
          disableCursor
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
            collapsible
            collapsedSize="0%"
            panelRef={groupsPanelRef}
            onResize={(size) => setGroupsCollapsed(size.asPercentage < 1)}
          >
            <aside
              className={cn(
                "flex h-full flex-col gap-2 overflow-hidden p-3",
                groupsCollapsed && "invisible pointer-events-none",
              )}
            >
              {leftPanel}
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleGroups();
              }}
              className="absolute left-1/2 top-1/2 z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              aria-label={groupsCollapsed ? "展开分组面板" : "收起分组面板"}
            >
              {groupsCollapsed ? (
                <ChevronRight className="pointer-events-none h-3 w-3" />
              ) : (
                <ChevronLeft className="pointer-events-none h-3 w-3" />
              )}
            </button>
          </ResizableHandle>

          <ResizablePanel
            id="list"
            defaultSize="20%"
            minSize="15%"
            maxSize="35%"
            collapsible
            collapsedSize="0%"
            panelRef={listPanelRef}
            onResize={(size) => setListCollapsed(size.asPercentage < 1)}
          >
            <aside
              className={cn(
                "flex h-full flex-col overflow-hidden",
                listCollapsed && "invisible pointer-events-none",
              )}
            >
              {middlePanel}
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleList();
              }}
              className="absolute left-1/2 top-1/2 z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              aria-label={listCollapsed ? "展开便签列表" : "收起便签列表"}
            >
              {listCollapsed ? (
                <ChevronRight className="pointer-events-none h-3 w-3" />
              ) : (
                <ChevronLeft className="pointer-events-none h-3 w-3" />
              )}
            </button>
          </ResizableHandle>

          <ResizablePanel id="editor" defaultSize="65%" minSize="40%">
            <div className="flex h-full min-w-0 flex-col">{children}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
