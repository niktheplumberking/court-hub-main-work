// Exercise the real server action against isolated storage/database doubles.
// No live credentials, database writes or network requests are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/actions/products.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function actionHarness(isAdmin = true) {
  const uploads = [];
  const records = [];
  const revalidated = [];
  const admin = {
    from(table) {
      if (table === 'admins') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: isAdmin ? { user_id: 'admin' } : null }) }) }) };
      assert.equal(table, 'products');
      return { insert: async (record) => { records.push(record); return { error: null }; } };
    },
    storage: { from(bucket) {
      assert.equal(bucket, 'products');
      return {
        upload: async (name, file, options) => { uploads.push({ name, file, options }); return { error: null }; },
        getPublicUrl: (name) => ({ data: { publicUrl: `https://example.test/products/${name}` } }),
      };
    } },
  };
  const mocks = {
    'next/cache': { revalidatePath: (...args) => revalidated.push(args) },
    'next/navigation': { redirect: () => { throw new Error('NEXT_REDIRECT'); } },
    '@/lib/supabase/server': { supabaseServer: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) } }) },
    '@/lib/supabase/admin': { supabaseAdmin: () => admin },
    '@/lib/utils': { slugify: () => 'original-photo-test' },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: (name) => { assert.ok(name in mocks, name); return mocks[name]; }, crypto: globalThis.crypto, console });
  return { save: exports.saveProduct, uploads, records, revalidated };
}

function productForm(file) {
  const form = new FormData();
  form.set('title', 'Original photo test');
  form.set('category_id', 'test-category');
  form.set('price_aed', '100');
  form.set('quantity', '1');
  form.set('image_files', file);
  return form;
}

(async () => {
  // A nontrivial binary payload catches truncation and re-encoding, independent
  // of how the original image was produced. Image decoding remains a UI concern.
  const bytes = Uint8Array.from({ length: 65537 }, (_, i) => (i * 37 + 11) % 256);
  const file = new File([bytes], 'original-camera-photo.png', { type: 'image/png' });
  const form = productForm(file);
  const allowed = actionHarness();
  await assert.rejects(allowed.save(form), /NEXT_REDIRECT/);
  assert.equal(allowed.uploads.length, 1);
  assert.equal(allowed.uploads[0].file, form.get('image_files'), 'upload must receive the unchanged original File');
  assert.deepEqual(new Uint8Array(await allowed.uploads[0].file.arrayBuffer()), bytes);
  assert.equal(allowed.uploads[0].options.contentType, 'image/png');
  assert.equal(allowed.uploads[0].options.upsert, false);
  assert.match(allowed.records[0].images[0], /^https:\/\/example.test\/products\/.+\.png$/);
  assert.ok(allowed.revalidated.some(([route]) => route === '/ar/shop'));

  const denied = actionHarness(false);
  await assert.rejects(denied.save(productForm(file)), /Unauthorized/);
  assert.equal(denied.uploads.length, 0, 'unauthorized requests must not upload');
  const unsupported = actionHarness();
  await assert.rejects(unsupported.save(productForm(new File(['<svg/>'], 'unsafe.svg', { type: 'image/svg+xml' }))), /not a JPG/);
  assert.equal(unsupported.uploads.length, 0);
  const oversized = actionHarness();
  await assert.rejects(oversized.save(productForm(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))), /larger than 10 MB/);
  assert.equal(oversized.uploads.length, 0);
  console.log('PASS: original upload bytes preserved; admin gate, unsupported type and size limit enforced.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
