import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

let cachedServeUrl: string | null = null;

async function getServeUrl(): Promise<string> {
  if (cachedServeUrl) return cachedServeUrl;
  const entry = path.resolve(process.cwd(), 'remotion/index.ts');
  cachedServeUrl = await bundle({ entryPoint: entry });
  return cachedServeUrl;
}

export async function POST(req: NextRequest) {
  try {
    const inputProps = await req.json();

    const serveUrl = await getServeUrl();

    const composition = await selectComposition({
      serveUrl,
      id: 'BeforeAfterStory',
      inputProps,
    });

    const outDir = path.resolve(process.cwd(), '.render-tmp');
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, `${randomUUID()}.mp4`);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outPath,
      inputProps,
    });

    const buffer = await fs.readFile(outPath);
    fs.unlink(outPath).catch(() => {});

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
  }
}
