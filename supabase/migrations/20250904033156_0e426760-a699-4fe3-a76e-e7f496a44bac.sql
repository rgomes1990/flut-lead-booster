-- Create storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 52428800, '{"image/*"}')
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload images
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  auth.uid() IS NOT NULL
);

-- Create policy for anyone to view images
CREATE POLICY "Images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'images');