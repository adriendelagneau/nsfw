import { NextResponse } from 'next/server';
import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const runtime = 'nodejs';
env.allowLocalModels = true;

const classifierPromise = pipeline(
  'image-classification',
  'AdamCodd/vit-base-nsfw-detector'
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Resize image
    const resized = await sharp(buffer)
      .resize(224, 224)
      .removeAlpha()
      .toFormat('jpeg')
      .toBuffer();

    const tmpPath = path.join('/tmp', `nsfw-${Date.now()}.jpg`);
    fs.writeFileSync(tmpPath, resized);

    const classifier = await classifierPromise;

    // ✅ Node-safe: pass path as string
    const results = await classifier(tmpPath);

    fs.unlinkSync(tmpPath);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'NSFW scan failed', details: (err as Error).message }, { status: 500 });
  }
}
