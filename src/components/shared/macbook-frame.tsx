import Image from 'next/image'

export function MacbookFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Lid */}
      <div className="relative rounded-t-[22px] border border-[#2b2623] bg-[#1c1917] p-[10px] pb-[10px] sm:p-3 shadow-2xl">
        {/* Camera */}
        <span aria-hidden className="absolute left-1/2 top-[3px] sm:top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-[#3a332e]" />
        <div className="overflow-hidden rounded-[10px] bg-background aspect-[16/10]">
          <Image
            src={src}
            alt={alt}
            width={2880}
            height={1800}
            className="h-full w-full object-cover object-top"
            sizes="(min-width: 1024px) 960px, 100vw"
          />
        </div>
      </div>
      {/* Base */}
      <div className="relative mx-auto h-3 sm:h-4 w-[108%] -translate-x-[3.7%] rounded-b-[18px] bg-gradient-to-b from-[#d6d3cf] to-[#a8a29e] shadow-[0_18px_30px_-12px_rgb(28_25_23/0.45)]">
        <span aria-hidden className="absolute left-1/2 top-0 h-1.5 w-24 sm:w-32 -translate-x-1/2 rounded-b-xl bg-[#8a847e]" />
      </div>
    </div>
  )
}
