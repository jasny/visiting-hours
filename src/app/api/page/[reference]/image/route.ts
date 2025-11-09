import { NextResponse } from 'next/server';
import { updatePage, getPage } from '@/services/pageService';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { cropAndResizeToWebp } from "@/lib/image"
import { credentials } from "@/lib/aws"

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Fetch current image to delete after successful update
    const currentPage = await getPage(reference);
    const oldImage = currentPage?.image;

    const { filename, contentType, buffer } = await cropAndResizeToWebp(file, { width: 500, height: 500 });

    const bucket = process.env.S3_BUCKET as string;
    const region = process.env.AWS_REGION || 'eu-west-1';

    if (!bucket) {
      return NextResponse.json({ error: 'Server not configured for S3 upload' }, { status: 500 });
    }

    const s3 = new S3Client({ region, credentials });

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
      })
    );

    await updatePage(reference, { image: filename });

    // Best-effort: delete the old image if it exists and differs from the new filename
    if (oldImage && oldImage !== filename) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: oldImage,
          })
        );
      } catch (err) {
        console.error('Failed to delete old image from S3', { reference, oldImage }, err);
      }
    }

    return NextResponse.json({ image: filename });
  } catch (e) {
    console.error('Upload error', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
