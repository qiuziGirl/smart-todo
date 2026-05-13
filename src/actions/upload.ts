"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export async function uploadNoteImage(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "未选择文件" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "图片不能超过 5MB" };
  }

  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") ?? "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from("note-images")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (upErr) {
    return { error: upErr.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("note-images").getPublicUrl(path);

  return { url: publicUrl };
}
