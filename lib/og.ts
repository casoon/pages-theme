import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { ResolvedConfig } from '../index';

/** Light theme tokens (styles/tokens.css) and the logo's petrol: the card follows casoon.de. */
const BG = '#f4f1eb';
const HEADING = '#11100e';
const TEXT = '#44423f';
const MUTED = '#5c5a56';
const BRAND = '#028baa';

const WIDTH = 1200;
const HEIGHT = 630;
const X = 88;

const asset = (path: string) => fileURLToPath(new URL(path, import.meta.url));
// TrueType, not the site's woff2: Pango on Linux (the Pages runners) ignores a woff2 font file
// and falls back to a system font.
const SANS = asset('../fonts/onest-latin-wght-normal.ttf');
const MONO = asset('../fonts/jetbrains-mono-latin-400-normal.ttf');

const escapeMarkup = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Cut at a word boundary so the text keeps to about three lines on the card. */
const clip = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, text.lastIndexOf(' ', max - 1))} …`;

/** One text block via Pango, in a font file of the theme: no system fonts involved. */
const text = (markup: string, font: string, fontfile: string, width: number) =>
  sharp({ text: { text: markup, font, fontfile, width, wrap: 'word', rgba: true } })
    .png()
    .toBuffer();

/** Largest name size whose single line fits the card, so a long name shrinks instead of wrapping. */
async function nameBlock(name: string, width: number): Promise<Buffer> {
  const markup = `<span foreground="${HEADING}" weight="600">${escapeMarkup(name)}</span>`;
  const sizes = [96, 80, 68, 58, 50];
  for (const size of sizes) {
    const block = await text(markup, `Onest ${size}`, SANS, width * 4);
    if (((await sharp(block).metadata()).width ?? 0) <= width) return block;
  }
  return text(markup, `Onest ${sizes[sizes.length - 1]}`, SANS, width);
}

/** The project's 1200×630 Open Graph image: name, tagline and description, address. */
export async function renderOgImage(config: ResolvedConfig, site: URL): Promise<Buffer> {
  const accent = config.accent?.light ?? BRAND;
  const logo = await sharp(await readFile(asset('../assets/casoon-logo.svg')), {
    density: 300,
  })
    .resize({ width: 176 })
    .png()
    .toBuffer();
  const address = `${site.host}${site.pathname}`.replace(/\/$/, '');
  const span = (color: string, content: string) =>
    `<span foreground="${color}">${escapeMarkup(content)}</span>`;

  const [eyebrow, name, tagline, description, host] = await Promise.all([
    text(span(MUTED, 'CASOON Open Source'), 'JetBrains Mono 26', MONO, 1000),
    nameBlock(config.name, WIDTH - 2 * X),
    config.tagline && text(span(HEADING, config.tagline), 'Onest 44', SANS, WIDTH - 2 * X),
    text(
      span(TEXT, clip(config.description, config.tagline ? 150 : 140)),
      config.tagline ? 'Onest 30' : 'Onest 40',
      SANS,
      WIDTH - 2 * X
    ),
    text(span(accent, address), 'JetBrains Mono 24', MONO, 640),
  ]);
  const size = async (image: Buffer) => sharp(image).metadata();
  // A short rule under the name, as on casoon.de, then tagline and description.
  const ruleTop = 128 + ((await size(name)).height ?? 0) + 20;
  const textTop = ruleTop + 4 + 32;
  const taglineHeight = tagline ? ((await size(tagline)).height ?? 0) + 20 : 0;
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">` +
      `<rect width="100%" height="100%" fill="${BG}"/>` +
      `<rect x="${X}" y="${ruleTop}" width="200" height="4" rx="2" fill="${accent}"/>` +
      '</svg>'
  );

  return sharp(background)
    .composite([
      { input: eyebrow, left: X, top: 76 },
      { input: name, left: X, top: 128 },
      ...(tagline ? [{ input: tagline, left: X, top: textTop }] : []),
      { input: description, left: X, top: textTop + taglineHeight },
      { input: logo, left: X, top: HEIGHT - 92 },
      { input: host, left: WIDTH - X - ((await size(host)).width ?? 0), top: HEIGHT - 80 },
    ])
    .png()
    .toBuffer();
}
