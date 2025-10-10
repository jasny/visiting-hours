'use client'

import Image, { type StaticImageData } from 'next/image';
import { useRef, useState, ChangeEvent } from 'react';
import { Pencil } from 'lucide-react';
import { Toast } from 'primereact/toast';
import type { Page } from '@/lib/types';
import { ProgressSpinner } from "primereact/progressspinner"

interface PageImageProps {
  info: Page;
  image: StaticImageData | string; // fallback image
  editable?: boolean;
}

export default function PageImage({ info, image, editable }: PageImageProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<Toast>(null);

  const hostname = process.env.NEXT_PUBLIC_S3_HOSTNAME;
  const s3Url = hostname && info.image ? `https://${hostname}/${info.image}` : null;

  const [imgSrc, setImgSrc] = useState<string | StaticImageData>(s3Url || image);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/page/${info.reference}/image`, { method: 'POST', body: form });
      if (!res.ok) {
        console.error('Upload failed', await res.text());
        toastRef.current?.show({ severity: 'error', summary: 'Uploaden is mislukt', detail: 'Probeer het opnieuw.' });
        return;
      }

      const { image } = await res.json();
      setImgSrc(`https://${hostname}/${image}`)
    } catch (err) {
      console.error(err);
      toastRef.current?.show({ severity: 'error', summary: 'Er is iets misgegaan', detail: 'Probeer het later nog eens.' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="relative">
      <Toast ref={toastRef} position="top-center" />
      <div
        className={`w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-xl ${
          editable ? 'cursor-pointer' : ''
        }`}
        onClick={() => editable && inputRef.current?.click()}
      >
        <Image src={imgSrc} width={500} height={500} alt="Foto of afbeelding" className="w-full h-full object-cover bg-[var(--theme-100)]" />
        { editable &&
          <div className="absolute top-[8%] right-[8%]">
            { !uploading && <div className="text-[var(--theme-700)] p-2 bg-white border-1 border-[var(--theme-200)] rounded-full"><Pencil className="w-5 h-5" /></div> }
            { uploading && <ProgressSpinner style={{width: '40px', height: '40px'}} strokeWidth="6" /> }
          </div>
        }
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--theme-300)] rounded-full opacity-60"></div>
      <div className="absolute -bottom-4 -left-4 w-8 h-8 border-2 border-[var(--theme-300)] rounded-full opacity-40"></div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}
