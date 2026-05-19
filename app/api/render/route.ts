import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  computeTotalFrames,
  type MediaInput,
} from '../../../remotion/lib/timing';

type FontPairId = 'A' | 'B' | 'C';

type BeforeAfterStoryProps = {
  hookText: string;
  beforeMedia: MediaInput;
  afterMedia: MediaInput;
  menuName: string;
  price?: string;
  duration?: string;
  salonName: string;
  fontPairId: FontPairId;
  bgmBeforeUrl?: string;
  bgmAfterUrl?: string;
};

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

type MediaMeta = {
  type: 'image' | 'video';
  url: string | null;
  startSec?: number;
  durationSec?: number;
  hasFile: boolean;
};

type BgmMeta = {
  hasFile: boolean;
  useDefault: boolean;
};

type Meta = {
  hookText: string;
  menuName: string;
  price?: string;
  duration?: string;
  salonName: string;
  fontPairId: FontPairId;
  beforeMedia: MediaMeta;
  afterMedia: MediaMeta;
  bgmBefore?: BgmMeta;
  bgmAfter?: BgmMeta;
};

const DEFAULT_BGM_BEFORE_URL = '/bgm/before.wav';
const DEFAULT_BGM_AFTER_URL = '/bgm/after.wav';

let cachedServeUrl: string | null = null;

async function getServeUrl(): Promise<string> {
  if (cachedServeUrl) return cachedServeUrl;
  const entry = path.resolve(process.cwd(), 'remotion/index.ts');
  cachedServeUrl = await bundle({ entryPoint: entry });
  return cachedServeUrl;
}

async function saveUpload(
  file: File,
  publicTmpDir: string
): Promise<{ localPath: string; urlPath: string }> {
  const ext = path.extname(file.name) || '.bin';
  const filename = `${randomUUID()}${ext}`;
  const localPath = path.join(publicTmpDir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(localPath, buf);
  return { localPath, urlPath: `/render-tmp/${filename}` };
}

function toAbsoluteHttpUrl(
  urlPath: string | null | undefined,
  origin: string
): string | undefined {
  if (!urlPath) return undefined;
  if (/^https?:\/\//.test(urlPath)) return urlPath;
  if (urlPath.startsWith('/')) return `${origin}${urlPath}`;
  return urlPath;
}

function resolveMedia(
  meta: MediaMeta,
  uploadedUrlPath: string | null,
  origin: string
): MediaInput {
  const urlPath = uploadedUrlPath ?? meta.url;
  const url = toAbsoluteHttpUrl(urlPath, origin) ?? '';
  if (meta.type === 'image') {
    return { type: 'image', url };
  }
  return {
    type: 'video',
    url,
    startSec: meta.startSec ?? 0,
    durationSec: meta.durationSec,
  };
}

export async function POST(req: NextRequest) {
  const publicTmpDir = path.resolve(process.cwd(), 'public', 'render-tmp');
  const outTmpDir = path.resolve(process.cwd(), '.render-tmp');
  await fs.mkdir(publicTmpDir, { recursive: true });
  await fs.mkdir(outTmpDir, { recursive: true });

  const cleanupPaths: string[] = [];
  const origin = req.nextUrl.origin;

  try {
    const formData = await req.formData();
    const metaRaw = formData.get('meta');
    if (typeof metaRaw !== 'string') {
      return NextResponse.json(
        { error: 'meta field is required' },
        { status: 400 }
      );
    }
    const meta = JSON.parse(metaRaw) as Meta;

    let beforeUrlPath: string | null = null;
    let afterUrlPath: string | null = null;

    const beforeFile = formData.get('beforeFile');
    if (beforeFile instanceof File && meta.beforeMedia.hasFile) {
      const r = await saveUpload(beforeFile, publicTmpDir);
      beforeUrlPath = r.urlPath;
      cleanupPaths.push(r.localPath);
    }
    const afterFile = formData.get('afterFile');
    if (afterFile instanceof File && meta.afterMedia.hasFile) {
      const r = await saveUpload(afterFile, publicTmpDir);
      afterUrlPath = r.urlPath;
      cleanupPaths.push(r.localPath);
    }

    const resolveBgm = async (
      bgmMeta: BgmMeta | undefined,
      formField: string,
      defaultUrlPath: string
    ): Promise<string | undefined> => {
      if (!bgmMeta) return undefined;
      if (bgmMeta.hasFile) {
        const file = formData.get(formField);
        if (file instanceof File) {
          const r = await saveUpload(file, publicTmpDir);
          cleanupPaths.push(r.localPath);
          return toAbsoluteHttpUrl(r.urlPath, origin);
        }
      }
      if (bgmMeta.useDefault) {
        return toAbsoluteHttpUrl(defaultUrlPath, origin);
      }
      return undefined;
    };

    const bgmBeforeUrl = await resolveBgm(
      meta.bgmBefore,
      'bgmBeforeFile',
      DEFAULT_BGM_BEFORE_URL
    );
    const bgmAfterUrl = await resolveBgm(
      meta.bgmAfter,
      'bgmAfterFile',
      DEFAULT_BGM_AFTER_URL
    );

    const inputProps: BeforeAfterStoryProps = {
      hookText: meta.hookText,
      menuName: meta.menuName,
      price: meta.price,
      duration: meta.duration,
      salonName: meta.salonName,
      fontPairId: meta.fontPairId,
      beforeMedia: resolveMedia(meta.beforeMedia, beforeUrlPath, origin),
      afterMedia: resolveMedia(meta.afterMedia, afterUrlPath, origin),
      bgmBeforeUrl,
      bgmAfterUrl,
    };

    const serveUrl = await getServeUrl();

    const composition = await selectComposition({
      serveUrl,
      id: 'BeforeAfterStory',
      inputProps,
    });

    composition.durationInFrames = computeTotalFrames(
      inputProps.beforeMedia,
      inputProps.afterMedia
    );

    const outPath = path.join(outTmpDir, `${randomUUID()}.mp4`);
    cleanupPaths.push(outPath);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
    });

    const buffer = await fs.readFile(outPath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="salon-before-after.mp4"',
        'Content-Length': String(buffer.byteLength),
      },
    });
  } catch (error) {
    console.error('Render error:', error);
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await Promise.allSettled(
      cleanupPaths.map((p) => fs.unlink(p).catch(() => undefined))
    );
  }
}
