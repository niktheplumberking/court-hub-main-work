// Deterministic brand artwork, using the same Inter Bold and colours as the header.
// Font: Google Fonts Inter (SIL OFL 1.1), license alongside this script's font asset.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { createElement: h } = require('react');
const { ImageResponse } = require('next/og');
const font = await readFile(new URL('./assets/Inter-Bold.ttf', import.meta.url));

async function render(size, output, square = false) {
  const wordmark = h('div', { style: { display: 'flex', alignItems: 'center', fontSize: square ? 43 : 84, letterSpacing: '0.16em', fontWeight: 700 } },
    h('span', { style: { color: '#FFFFFF' } }, 'COURT'),
    h('span', { style: { color: '#8EC5FF', marginLeft: square ? 12 : 24 } }, 'HUB'));
  const content = h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#0A2A66', color: '#FFFFFF', fontFamily: 'Inter', position: 'relative' } },
    h('div', { style: { position: 'absolute', inset: square ? 24 : 42, border: '1px solid rgba(142,197,255,0.3)', borderRadius: square ? 30 : 32, display: 'flex' } }),
    !square && h('div', { style: { color: '#8EC5FF', fontSize: 14, letterSpacing: '0.26em', marginBottom: 38 } }, 'DUBAI, UAE'),
    wordmark,
    !square && h('div', { style: { fontSize: 20, letterSpacing: '0.06em', marginTop: 30, color: '#EAF3FF' } }, 'PADEL EQUIPMENT / COURT CONSTRUCTION'),
    !square && h('div', { style: { fontSize: 16, letterSpacing: '0.12em', color: '#8EC5FF', position: 'absolute', bottom: 76 } }, 'courthub.ae'));
  const image = new ImageResponse(content, { width: size[0], height: size[1], fonts: [{ name: 'Inter', data: font, weight: 700, style: 'normal' }] });
  await writeFile(output, Buffer.from(await image.arrayBuffer()));
}

await render([1200, 630], 'public/brand/court-hub-share-v1.4.png');
await render([512, 512], 'public/brand/court-hub-logo-v1.4.png', true);
console.log('Generated static 1200x630 share image and 512x512 brand logo.');
