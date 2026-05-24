export type NoteListItem = {
  id: string;
  title: string | null;
  updatedAt: string;
  isPinned: boolean;
  groupId: string | null;
  preview: string;
  searchText: string;
};

export type GroupListItem = {
  id: string;
  name: string;
};
