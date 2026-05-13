export type NoteListItem = {
  id: string;
  title: string | null;
  updatedAt: string;
  isPinned: boolean;
  preview: string;
};

export type GroupListItem = {
  id: string;
  name: string;
};
