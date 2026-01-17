import { NextResponse } from 'next/server';
import { pipeline, env } from '@xenova/transformers';
import sharp from 'sharp';

export const runtime = 'nodejs';
env.allowLocalModels = false;

// Load model once
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

    // Resize image in-memory
    const resized = await sharp(buffer)
      .resize(224, 224)
      .removeAlpha()
      .toFormat('jpeg')
      .toBuffer();

    const classifier = await classifierPromise;

    // Pass Uint8Array to satisfy TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const results = await classifier(resized as any);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'NSFW scan failed' }, { status: 500 });
  }
}
