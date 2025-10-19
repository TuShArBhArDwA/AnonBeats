import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));

  const folder = body.folder || process.env.CLOUDINARY_FOLDER || 'anonbeats/tracks';
  const tags = typeof body.tags === 'string' ? body.tags : undefined;          // e.g., "anonbeats"
  const context = typeof body.context === 'string' ? body.context : undefined; // e.g., "title=My Song|artist=Me"
  const public_id = typeof body.public_id === 'string' ? body.public_id : undefined;

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = { timestamp, folder };
  if (tags) paramsToSign.tags = tags;
  if (context) paramsToSign.context = context;
  if (public_id) paramsToSign.public_id = public_id;

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder,
    // echo back to reuse exactly
    tags: tags || null,
    context: context || null,
    public_id: public_id || null,
  });
}