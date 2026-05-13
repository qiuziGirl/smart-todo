-- 将业务表加入 supabase_realtime publication，供客户端 postgres_changes 订阅（需在 Dashboard 已开启 Realtime 时使用）
-- 若表已在 publication 中，对应语句会报错，可忽略后手动检查。

ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_items;
