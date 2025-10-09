import { Page } from "@/lib/types"
import Image, { StaticImageData } from "next/image"
import { format as dfFormat, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useMemo } from "react"

interface Props {
  info: Page;
  image?: StaticImageData;
}

export default function PageInfo({ info, image }: Props) {
  const formattedDob = useMemo(() => {
    if (!info.date_of_birth) return null;

    const date = parseISO(info.date_of_birth);
    if (isNaN(date.getTime())) return null;
    return dfFormat(date, 'd MMMM yyyy', { locale: nl });
  }, [info.date_of_birth]);

  return (
    <div
      className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-coral-50 px-6 py-16 md:px-12 md:py-24 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-12 left-12 w-8 h-8 border-2 border-rose-300 rounded-full"></div>
        <div className="absolute top-24 right-24 w-4 h-4 bg-rose-200 rounded-full"></div>
        <div className="absolute bottom-32 left-24 w-6 h-6 border border-pink-200 rounded-full"></div>
        <div className="absolute bottom-48 right-16 w-3 h-3 bg-coral-200 rounded-full"></div>
        <div className="absolute top-16 right-12 w-16 h-12 opacity-20">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-rose-300">
            <path
              d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10c1.5 0 3-0.3 4.3-0.9l-1.3-1.3c-1 0.4-2 0.6-3 0.6-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8c0 1-0.2 2-0.6 3l1.3 1.3c0.6-1.3 0.9-2.8 0.9-4.3 0-5.5-4.5-10-10-10z"
              stroke="currentColor" stroke-width="1.5"></path>
          </svg>
        </div>
        <div className="absolute bottom-16 left-32 w-12 h-8 opacity-15">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-pink-300">
            <path d="M3 12l3-3v2h12v2H6v2l-3-3z" fill="currentColor"></path>
            <circle cx="18" cy="12" r="2" fill="currentColor"></circle>
          </svg>
        </div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="mb-8"><p className="text-rose-600 italic text-lg md:text-xl mb-2 font-light">Jij bent zo welkom!</p></div>
        <div className="mb-6"><h1
          className="text-4xl md:text-6xl lg:text-7xl font-light tracking-wide text-rose-800 mb-4 uppercase">{info.name}</h1>
          <div className="flex items-center justify-center gap-4 text-rose-600">
            <div className="flex-1 h-px bg-rose-200"></div>
            <p className="text-lg md:text-xl px-4">{formattedDob ?? info.date_of_birth ?? ''}</p>
            <div className="flex-1 h-px bg-rose-200"></div>
          </div>
        </div>
        <div className="mb-12 flex justify-center">
          <div className="relative">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <Image src={image} alt="Foto of afbeelding" className="w-full h-full object-cover"/></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-300 rounded-full opacity-60"></div>
            <div
              className="absolute -bottom-4 -left-4 w-8 h-8 border-2 border-rose-300 rounded-full opacity-40"></div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light italic">&#34;{info.description}&#34;</p>
          <p className="text-rose-600 mt-6 text-lg">— Met veel liefde, {info.parent_name}</p>
        </div>
      </div>
    </div>
  );
}
