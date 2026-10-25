import assert from 'node:assert/strict';
import { arrayLiteral, applyImages, imageClient, restoreImages } from './release-product-images.mjs';

const original = { id: 'product-1', slug: 'exact-model', title: 'Exact model', images: ['https://images/old.png'], price_aed: 1200, quantity: 2, condition: 'good' };
const backup = { entries: [{ before: structuredClone(original), afterImages: ['https://images/new.png'] }] };
let row = structuredClone(original);
let uncertainFailure = false;
const client = {
  read: async () => structuredClone(row),
  patch: async (_, expected, images) => {
    assert.deepEqual(row.images, expected);
    row.images = [...images];
    if (uncertainFailure) { uncertainFailure = false; throw new Error('Response lost after database update'); }
    return structuredClone(row);
  },
};

await applyImages(client, backup);
assert.deepEqual(row, { ...original, images: backup.entries[0].afterImages });
await restoreImages(client, backup);
assert.deepEqual(row, original);

uncertainFailure = true;
await assert.rejects(applyImages(client, backup), /Original image arrays restored/);
assert.deepEqual(row, original, 'An uncertain response must not leave an unrecorded image change.');

row.images = ['https://images/newer-admin-upload.png'];
await assert.rejects(restoreImages(client, backup), /Newer images/);
assert.deepEqual(row.images, ['https://images/newer-admin-upload.png']);

let request;
const api = imageClient('test-key-not-a-real-secret', async (url, options) => {
  request = { url: new URL(url), options };
  return Response.json([{ ...original, images: backup.entries[0].afterImages }]);
});
await api.patch(original, original.images, backup.entries[0].afterImages);
assert.equal(request.options.method, 'PATCH');
assert.deepEqual(JSON.parse(request.options.body), { images: backup.entries[0].afterImages });
assert.equal(request.url.searchParams.get('id'), 'eq.product-1');
assert.equal(request.url.searchParams.get('images'), 'eq.{"https://images/old.png"}');
assert.equal(request.options.redirect, 'error', 'Privileged headers must never follow a redirect.');
assert.equal(arrayLiteral(['a"b', 'c\\d']), '{"a\\"b","c\\\\d"}');

const conflict = imageClient('test-key-not-a-real-secret', async () => Response.json([]));
await assert.rejects(conflict.patch(original, original.images, ['new']), /concurrently/);
console.log('PASS: image-only writes, original restore, uncertain-write recovery, concurrent-edit refusal and bounded API filters.');
