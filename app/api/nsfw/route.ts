import { NextResponse } from 'next/server';
import { pipeline, env } from '@xenova/transformers';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

    // Resize image
    const resized = await sharp(buffer)
      .resize(224, 224)
      .removeAlpha()
      .toFormat('jpeg')
      .toBuffer();

    // Save temp file
    const tmpPath = path.join(os.tmpdir(), `nsfw-${Date.now()}.jpg`);
    fs.writeFileSync(tmpPath, resized);

    const classifier = await classifierPromise;

    // Pass file path (works in Node)
    const results = await classifier(tmpPath);

    // Clean up
    fs.unlinkSync(tmpPath);

    return NextResponse.json({
      ok: true,
      results
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'NSFW scan failed' }, { status: 500 });
  }
}
