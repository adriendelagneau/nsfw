import { NextResponse } from 'next/server';
import { pipeline, env } from '@xenova/transformers';
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

    // Resize and remove alpha
    const resized = await sharp(buffer)
      .resize(224, 224)
      .removeAlpha()
      .toFormat('jpeg')
      .toBuffer();

    const classifier = await classifierPromise;

    // Pass buffer directly instead of saving to tmp
    const results = await classifier(resized);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'NSFW scan failed' }, { status: 500 });
  }
}
