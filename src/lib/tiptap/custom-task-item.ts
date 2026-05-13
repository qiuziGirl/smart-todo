import TaskItem from "@tiptap/extension-task-item";

/** 便签内待办：在默认 TaskItem 上增加到期 / 提醒（存 ISO 字符串 attrs，供聚合页与后续推送使用） */
export const CustomTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      dueAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-due-at"),
        renderHTML: (attributes: { dueAt?: string | null }) => {
          if (!attributes.dueAt) {
            return {};
          }
          return { "data-due-at": attributes.dueAt };
        },
      },
      remindAt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-remind-at"),
        renderHTML: (attributes: { remindAt?: string | null }) => {
          if (!attributes.remindAt) {
            return {};
          }
          return { "data-remind-at": attributes.remindAt };
        },
      },
    };
  },
});
