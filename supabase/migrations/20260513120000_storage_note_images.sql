-- 便签图片存储桶 + 策略（与 Storage RLS 一致）
-- 路径约定：{auth.uid()}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "note_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "note_images_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "note_images_update_own" ON storage.objects;
DROP POLICY IF EXISTS "note_images_delete_own" ON storage.objects;

CREATE POLICY "note_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'note-images');

CREATE POLICY "note_images_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "note_images_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "note_images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'note-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
