require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

async function setupStorage() {
  console.log('🔧 Setting up Supabase Storage...');

  // 1. List existing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    return;
  }
  console.log('📦 Existing buckets:', buckets.map(b => b.name).join(', ') || '(none)');

  // 2. Create bucket if it doesn't exist
  const existing = buckets.find(b => b.name === BUCKET_NAME);
  if (!existing) {
    console.log(`📦 Creating bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip'
      ]
    });
    if (createError) {
      console.error('❌ Error creating bucket:', createError.message);
      return;
    }
    console.log(`✅ Bucket "${BUCKET_NAME}" created with public access`);
  } else {
    // Update bucket to ensure it's public
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
      public: true
    });
    if (updateError) {
      console.warn('⚠️ Could not update bucket:', updateError.message);
    }
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists (public: ${existing.public ?? 'unknown'})`);
  }

  // 3. Test upload
  console.log('🧪 Testing upload...');
  const testContent = Buffer.from('test file content');
  const testPath = `test/${Date.now()}-test.txt`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(testPath, testContent, { contentType: 'text/plain' });
  
  if (uploadError) {
    console.error('❌ Test upload failed:', uploadError.message);
    return;
  }
  console.log('✅ Test upload successful');

  // 4. Test public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(testPath);
  console.log('🔗 Public URL:', urlData.publicUrl);

  // 5. Clean up test file
  await supabase.storage.from(BUCKET_NAME).remove([testPath]);
  console.log('🧹 Test file cleaned up');

  console.log('\n✅ Supabase Storage setup complete!');
}

setupStorage().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
