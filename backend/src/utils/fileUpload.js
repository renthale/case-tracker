const supabase = require('../config/supabase');
const path = require('path');
const fs = require('fs');

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

const uploadFile = async (file, folder = 'general') => {
  if (!supabase) {
    return { url: null, path: null, error: 'Supabase Storage not configured' };
  }

  const ext = path.extname(file.originalname);
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    return { url: null, path: null, error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    path: fileName,
    error: null
  };
};

const deleteFile = async (filePath) => {
  if (!supabase || !filePath) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
  }
};

const getFileUrl = (filePath) => {
  if (!supabase || !filePath) return null;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
};

module.exports = { uploadFile, deleteFile, getFileUrl };
