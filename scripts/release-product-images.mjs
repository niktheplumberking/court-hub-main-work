// Release-only CLI. Never import into the application or expose as a route.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROJECT = 'https://rtbwvbgdbxztrdcthzrb.supabase.co';
const MANIFEST = 'docs/releases/v1.3-product-images.json';
const fields = 'id,slug,title,images,condition,price_aed,quantity,status';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function arrayLiteral(values) {
  return `{${values.map((s) => `"${s.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`).join(',')}}`;
}

export function imageClient(secret, transport = fetch) {
  if (!secret) throw new Error('Missing server-side Supabase key.');
  async function request(path, options = {}) {
    const response = await transport(`${PROJECT}${path}`, {
      ...options,
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
      headers: { apikey: secret, Authorization: `Bearer ${secret}`, ...options.headers },
    });
    if (!response.ok) throw new Error(`Catalogue request failed (${response.status}).`);
    return response.json();
  }
  return {
    async read(slug) {
      const q = new URLSearchParams({ select: fields, slug: `eq.${slug}` });
      const rows = await request(`/rest/v1/products?${q}`);
      if (rows.length !== 1) throw new Error(`Expected one product for ${slug}.`);
      return rows[0];
    },
    async patch(row, expected, images) {
      const q = new URLSearchParams({ id: `eq.${row.id}`, images: `eq.${arrayLiteral(expected)}`, select: fields });
      const rows = await request(`/rest/v1/products?${q}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ images }),
      });
      if (rows.length !== 1 || !same(rows[0].images, images)) {
        throw new Error(`Images changed concurrently for ${row.slug}; refusing to overwrite.`);
      }
      return rows[0];
    },
    async upload(path, bytes, sha256) {
      const publicPath = `/storage/v1/object/public/products/${path}`;
      const existing = await transport(`${PROJECT}${publicPath}`, { redirect: 'error', signal: AbortSignal.timeout(30000) });
      if (existing.ok) {
        if (digest(Buffer.from(await existing.arrayBuffer())) !== sha256) throw new Error(`Stored image differs: ${path}`);
        return;
      }
      if (![400, 404].includes(existing.status)) throw new Error(`Image lookup failed (${existing.status}).`);
      await request(`/storage/v1/object/products/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=31536000', 'x-upsert': 'false' }, body: bytes,
      });
      const stored = await transport(`${PROJECT}${publicPath}`, { redirect: 'error', signal: AbortSignal.timeout(30000) });
      if (!stored.ok || digest(Buffer.from(await stored.arrayBuffer())) !== sha256) throw new Error(`Image verification failed: ${path}`);
    },
  };
}

export async function restoreImages(client, backup) {
  // Also handles an uncertain PATCH response: inspect all planned records.
  for (const entry of [...backup.entries].reverse()) {
    const current = await client.read(entry.before.slug);
    if (current.id !== entry.before.id) throw new Error('Product identity mismatch.');
    if (same(current.images, entry.before.images)) continue;
    if (!same(current.images, entry.afterImages)) throw new Error(`Newer images found for ${current.slug}; restore requires review.`);
    await client.patch(current, entry.afterImages, entry.before.images);
  }
}

export async function applyImages(client, backup, checkpoint = async () => {}) {
  try {
    for (const entry of backup.entries) {
      const current = await client.read(entry.before.slug);
      if (current.id !== entry.before.id || !same(current.images, entry.before.images)) throw new Error(`Product images changed: ${entry.before.slug}`);
      await client.patch(current, entry.before.images, entry.afterImages);
      await checkpoint(entry.before.slug);
    }
  } catch (error) {
    await restoreImages(client, backup);
    throw new Error(`${error.message} Original image arrays restored.`);
  }
}

async function main() {
  const [mode, backupPath] = process.argv.slice(2);
  if (!['--check', '--apply', '--restore'].includes(mode) || !backupPath) {
    throw new Error('Usage: node scripts/release-product-images.mjs --check|--apply|--restore /protected/path/images-v1.3.json');
  }
  createRequire(import.meta.url)('@next/env').loadEnvConfig(process.cwd());
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') !== PROJECT) throw new Error('Unexpected Supabase project.');
  const client = imageClient(process.env.SUPABASE_SECRET_KEY);
  if (mode === '--restore') {
    const backup = JSON.parse(await readFile(backupPath, 'utf8'));
    if (backup.project !== PROJECT || backup.version !== '1.3' || backup.entries.length !== 8) throw new Error('Invalid backup.');
    await restoreImages(client, backup);
    console.log('Original image arrays restored for all eight products. Storage files retained.');
    return;
  }
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  if (manifest.length !== 8 || new Set(manifest.map((x) => x.slug)).size !== 8) throw new Error('Invalid image manifest.');
  const backup = { version: '1.3', project: PROJECT, createdAt: new Date().toISOString(), entries: [] };
  const assets = [];
  for (const item of manifest) {
    const bytes = await readFile(item.file);
    if (digest(bytes) !== item.sha256 || bytes.readUInt32BE(16) !== 1200 || bytes.readUInt32BE(20) !== 1200) throw new Error(`Invalid approved image: ${item.file}`);
    const before = await client.read(item.slug);
    if (before.title.trim().toLowerCase() !== item.title.trim().toLowerCase() || !before.images.includes(item.previousImage)) {
      throw new Error(`Product no longer matches approved manifest: ${item.slug}`);
    }
    const image = `${PROJECT}/storage/v1/object/public/products/${item.storagePath}`;
    backup.entries.push({ before, afterImages: before.images.map((src) => src === item.previousImage ? image : src) });
    assets.push({ item, bytes });
  }
  if (mode === '--check') {
    console.log('CHECK_OK: eight exact products, original image arrays and approved 1200px file checksums match. No writes.');
    return;
  }
  // Never overwrite an earlier backup. Save before any storage or data write.
  await writeFile(backupPath, JSON.stringify(backup, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  for (const { item, bytes } of assets) await client.upload(item.storagePath, bytes, item.sha256);
  await applyImages(client, backup, async (slug) => console.log(`Updated image: ${slug}`));
  for (const entry of backup.entries) {
    const current = await client.read(entry.before.slug);
    if (!same(current.images, entry.afterImages)) throw new Error('Final image verification failed. Backup is available for restore.');
  }
  console.log('IMAGES_V1.3_OK: all eight image arrays verified. Only images were patched.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
