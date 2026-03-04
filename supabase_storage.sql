-- Script Auxiliar para criação do Bucket de Imagens
-- Execute este script no SQL Editor do Supabase junto com o anterior.

-- ==========================================
-- 4. BUCKET DE IMAGENS CNH E REGAS
-- ==========================================

-- Cria o bucket 'cnh_images' caso não exista
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cnh_images', 'cnh_images', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir leitura pública dos arquivos das CNHs
CREATE POLICY "Public Access for CNHs" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'cnh_images' );

-- Permitir upload apenas de usuários autenticados para suas respectivas pastas
CREATE POLICY "Authenticated users can upload CNH" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'cnh_images' AND auth.role() = 'authenticated'
);

-- Permitir edição dos próprios arquivos
CREATE POLICY "Users can update their own CNHs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cnh_images' AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Permitir exclusão dos próprios arquivos
CREATE POLICY "Users can delete their own CNHs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cnh_images' AND auth.uid()::text = (string_to_array(name, '/'))[1]
);
