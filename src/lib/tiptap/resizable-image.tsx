"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, ImageUp, Trash2, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { uploadNoteImage } from "@/actions/upload";
import { cn } from "@/lib/utils";

type ImageAlign = "left" | "center" | "right";

type ImageAttrs = {
  src: string;
  alt?: string | null;
  title?: string | null;
  width?: number | null;
  height?: number | null;
  align?: ImageAlign | null;
  caption?: string | null;
};

const MIN_IMAGE_WIDTH = 120;

function normalizeAlign(value: unknown): ImageAlign {
  return value === "center" || value === "right" ? value : "left";
}

function imageToolbarButtonClass(active = false) {
  return cn(
    "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
    "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    active && "bg-muted text-foreground"
  );
}

function ResizableImageView({
  node,
  editor,
  selected,
  getPos,
  updateAttributes,
  deleteNode,
}: ReactNodeViewProps) {
  const attrs = node.attrs as ImageAttrs;
  const align = normalizeAlign(attrs.align);
  const caption = attrs.caption ?? "";
  const imageRef = useRef<HTMLImageElement>(null);
  const previewDialogRef = useRef<HTMLDivElement>(null);
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  const lastFocusedBeforePreviewRef = useRef<HTMLElement | null>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const captionDraftRef = useRef(caption);
  const fileRef = useRef<HTMLInputElement>(null);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const persistedWidth = typeof attrs.width === "number" ? attrs.width : null;
  const displayWidth = resizeWidth ?? persistedWidth;
  const showCaption = selected || caption.trim().length > 0;
  const showPreviewButton = hovered || selected || previewOpen;

  useEffect(() => {
    // 外部 attrs 更新时，同步到草稿值；若输入框未聚焦则同步可见文本。
    captionDraftRef.current = caption;
    const input = captionInputRef.current;
    if (input && document.activeElement !== input) {
      input.value = caption;
    }
  }, [caption]);

  useEffect(() => {
    if (!previewOpen) {
      return;
    }

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusTimerId = window.setTimeout(() => {
      previewCloseRef.current?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewOpen(false);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const root = previewDialogRef.current;
      if (!root) {
        return;
      }
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.hasAttribute("disabled")
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const activeEl = active instanceof HTMLElement ? active : null;
      const isInside = !!activeEl && root.contains(activeEl);

      if (event.shiftKey) {
        if (!isInside || activeEl === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!isInside || activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("is-previewing-tiptap-image");
    return () => {
      window.clearTimeout(focusTimerId);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("is-previewing-tiptap-image");
      const lastFocused = lastFocusedBeforePreviewRef.current;
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
      lastFocusedBeforePreviewRef.current = null;
    };
  }, [previewOpen]);

  function updateImageAttributes(nextAttrs: Partial<ImageAttrs>) {
    updateAttributes({
      src: attrs.src,
      alt: attrs.alt ?? null,
      title: attrs.title ?? null,
      width: persistedWidth,
      height: null,
      align,
      caption: attrs.caption ?? null,
      ...nextAttrs,
    });
  }

  function selectImage() {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (typeof pos !== "number") {
      return;
    }
    editor.chain().setNodeSelection(pos).run();
  }

  function openPreview() {
    selectImage();
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      lastFocusedBeforePreviewRef.current = active instanceof HTMLElement ? active : null;
    }
    setPreviewOpen(true);
  }

  function setAlign(nextAlign: ImageAlign) {
    selectImage();
    updateImageAttributes({ align: nextAlign });
  }

  function commitCaption(value: string, trim = true) {
    const normalized = trim ? value.trim() : value;
    const nextCaption = normalized.length > 0 ? normalized : null;
    if ((attrs.caption ?? null) === nextCaption) {
      return;
    }
    updateImageAttributes({ caption: nextCaption });
  }

  async function onReplaceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const r = await uploadNoteImage(fd);
      if ("error" in r && r.error) {
        toast.error(r.error);
        return;
      }
      if ("url" in r && r.url) {
        updateImageAttributes({
          src: r.url,
          width: displayWidth,
          height: null,
        });
      }
    } finally {
      setUploading(false);
    }
  }

  function onResizePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    selectImage();

    const image = imageRef.current;
    const editorRoot = image?.closest(".tiptap-editor") as HTMLElement | null;
    if (!image || !editorRoot) {
      return;
    }

    const startX = e.clientX;
    const startWidth = image.getBoundingClientRect().width;
    const startWidthRounded = Math.round(startWidth);
    const maxWidth = Math.max(MIN_IMAGE_WIDTH, editorRoot.clientWidth - 32);
    let nextWidth = startWidthRounded;
    document.body.classList.add("is-resizing-tiptap-image");

    function onPointerMove(event: PointerEvent) {
      const delta = event.clientX - startX;
      nextWidth = Math.min(maxWidth, Math.max(MIN_IMAGE_WIDTH, Math.round(startWidth + delta)));
      setResizeWidth(nextWidth);
    }

    function cleanupResizeState() {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      document.body.classList.remove("is-resizing-tiptap-image");
    }

    function onPointerUp() {
      cleanupResizeState();
      setResizeWidth(null);
      if (nextWidth === startWidthRounded) {
        return;
      }
      updateImageAttributes({ width: nextWidth, height: null });
    }

    function onPointerCancel() {
      cleanupResizeState();
      setResizeWidth(null);
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp, { once: true });
    document.addEventListener("pointercancel", onPointerCancel, { once: true });
  }

  function onResizeKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    selectImage();

    const image = imageRef.current;
    const editorRoot = image?.closest(".tiptap-editor") as HTMLElement | null;
    if (!image || !editorRoot) {
      return;
    }
    const maxWidth = Math.max(MIN_IMAGE_WIDTH, editorRoot.clientWidth - 32);
    const current = Math.round(image.getBoundingClientRect().width);
    const delta = e.key === "ArrowRight" ? 16 : -16;
    const nextWidth = Math.min(maxWidth, Math.max(MIN_IMAGE_WIDTH, current + delta));
    if (nextWidth === current) {
      return;
    }
    updateImageAttributes({ width: nextWidth, height: null });
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        "tiptap-image-block",
        `is-align-${align}`,
        selected && "is-selected",
        showCaption && "has-caption"
      )}
      contentEditable={false}
      data-align={align}
    >
      <div
        className="tiptap-image-frame"
        onClick={openPreview}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPreview();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="预览图片"
        style={{ cursor: "zoom-in" }}
      >
        {selected && (
          <div className="tiptap-image-toolbar tiptap-image-node-controls" role="toolbar" aria-label="图片工具栏">
            <button
              type="button"
              className={imageToolbarButtonClass(align === "left")}
              onClick={(e) => {
                e.stopPropagation();
                setAlign("left");
              }}
              aria-label="左对齐"
              aria-pressed={align === "left"}
            >
              <AlignLeft className="size-4" />
            </button>
            <button
              type="button"
              className={imageToolbarButtonClass(align === "center")}
              onClick={(e) => {
                e.stopPropagation();
                setAlign("center");
              }}
              aria-label="居中对齐"
              aria-pressed={align === "center"}
            >
              <AlignCenter className="size-4" />
            </button>
            <button
              type="button"
              className={imageToolbarButtonClass(align === "right")}
              onClick={(e) => {
                e.stopPropagation();
                setAlign("right");
              }}
              aria-label="右对齐"
              aria-pressed={align === "right"}
            >
              <AlignRight className="size-4" />
            </button>
            <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
            <button
              type="button"
              className={imageToolbarButtonClass()}
              onClick={(e) => {
                e.stopPropagation();
                fileRef.current?.click();
              }}
              disabled={uploading}
              aria-label="替换图片"
            >
              <ImageUp className="size-4" />
            </button>
            <button
              type="button"
              className={imageToolbarButtonClass()}
              onClick={(e) => {
                e.stopPropagation();
                deleteNode();
              }}
              aria-label="删除图片"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- TipTap image nodes render user-uploaded editor content with dynamic dimensions. */}
        <img
          ref={imageRef}
          src={attrs.src}
          alt={attrs.alt ?? ""}
          title={attrs.title ?? undefined}
          draggable={false}
          style={{ width: displayWidth ? `${displayWidth}px` : undefined, cursor: "zoom-in" }}
        />
        <button
          type="button"
          className="tiptap-image-preview-button tiptap-image-node-controls"
          onClick={(e) => {
            e.stopPropagation();
            openPreview();
          }}
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "0.5rem",
            zIndex: 20,
            display: "inline-flex",
            width: "2rem",
            height: "2rem",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgb(255 255 255 / 0.42)",
            borderRadius: "999px",
            background: "rgb(17 24 39 / 0.68)",
            color: "white",
            cursor: "zoom-in",
            opacity: showPreviewButton ? 1 : 0,
            transform: showPreviewButton ? "translateY(0)" : "translateY(-2px)",
            transition: "opacity 120ms ease, transform 120ms ease, background-color 120ms ease",
          }}
          aria-label="预览图片"
        >
          <ZoomIn className="size-4" />
        </button>
        {selected && (
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-node-controls"
            onPointerDown={onResizePointerDown}
            onKeyDown={onResizeKeyDown}
            aria-label="调整图片大小"
          />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onReplaceImage}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {showCaption && (
        <input
          ref={captionInputRef}
          className="tiptap-image-caption tiptap-image-node-controls"
          defaultValue={caption}
          onChange={(e) => {
            captionDraftRef.current = e.currentTarget.value;
          }}
          onBlur={(e) => {
            const normalized = captionDraftRef.current.trim();
            e.currentTarget.value = normalized;
            captionDraftRef.current = normalized;
            commitCaption(normalized, false);
          }}
          onClick={(e) => e.stopPropagation()}
          placeholder="添加说明"
          aria-label="图片说明"
        />
      )}
      {previewOpen && (
        <div
          className="tiptap-image-preview-backdrop tiptap-image-node-controls"
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          onClick={() => setPreviewOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgb(15 23 42 / 0.82)",
            padding: "2rem",
            cursor: "zoom-out",
          }}
        >
          <div
            className="tiptap-image-preview-dialog"
            ref={previewDialogRef}
            style={{
              position: "relative",
              display: "flex",
              maxWidth: "min(94vw, 1280px)",
              maxHeight: "90vh",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              className="tiptap-image-preview-close"
              ref={previewCloseRef}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewOpen(false);
              }}
              style={{
                position: "fixed",
                right: "1.25rem",
                top: "1.25rem",
                zIndex: 1001,
                display: "inline-flex",
                width: "2.25rem",
                height: "2.25rem",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgb(255 255 255 / 0.28)",
                borderRadius: "999px",
                background: "rgb(15 23 42 / 0.72)",
                color: "white",
                cursor: "pointer",
              }}
              aria-label="关闭图片预览"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- Preview renders the editor's current uploaded image URL. */}
            <img
              src={attrs.src}
              alt={attrs.alt ?? caption ?? ""}
              title={attrs.title ?? undefined}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "90vh",
                width: "auto",
                height: "auto",
                borderRadius: "var(--radius-md)",
                background: "var(--background)",
                boxShadow: "0 24px 80px rgb(0 0 0 / 0.38)",
                cursor: "default",
              }}
            />
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      align: {
        default: "left",
        parseHTML: (element) => normalizeAlign(element.getAttribute("data-align")),
        renderHTML: (attributes) => ({
          "data-align": normalizeAlign(attributes.align),
        }),
      },
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-caption"),
        renderHTML: (attributes) =>
          attributes.caption ? { "data-caption": String(attributes.caption) } : {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView, {
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement | null;
        return target?.closest(".tiptap-image-node-controls") !== null;
      },
    });
  },
});
