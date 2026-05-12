export const APP_NAME = "Smart Note";
export const APP_DESCRIPTION = "便签 + 待办，多端同步的轻量笔记应用";

export const NOTE_COLORS = [
  { id: "yellow", name: "柠檬黄", hex: "#FEF3C7" },
  { id: "pink", name: "樱花粉", hex: "#FCE7F3" },
  { id: "blue", name: "天空蓝", hex: "#DBEAFE" },
  { id: "green", name: "薄荷绿", hex: "#D1FAE5" },
  { id: "purple", name: "薰衣紫", hex: "#E9D5FF" },
  { id: "gray", name: "雾霭灰", hex: "#E5E7EB" },
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number]["id"];

export const TRASH_RETENTION_DAYS = 30;
