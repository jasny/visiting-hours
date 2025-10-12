import { NextResponse } from 'next/server';
import { updatePage } from '@/services/pageService';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { cropAndResizeToWebp } from "@/lib/image"
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider"

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const { filename, contentType, buffer } = await cropAndResizeToWebp(file, { width: 500, height: 500 });

    const bucket = process.env.S3_BUCKET as string;
    const region = process.env.AWS_REGION || 'eu-west-1';

    if (!bucket) {
      return NextResponse.json({ error: 'Server not configured for S3 upload' }, { status: 500 });
    }

    const credentials = process.env.AWS_ROLE_ARN
      ? awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN! })
      : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
      };

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

    return NextResponse.json({ image: filename });
  } catch (e) {
    console.error('Upload error', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
