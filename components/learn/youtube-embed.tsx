"use client";

import { Play } from "lucide-react";
import { useState } from "react";

/**
 * Lite embed: chỉ tải ảnh thumbnail; iframe (≈1MB JS của YouTube) chỉ tải khi người dùng bấm phát.
 * Dùng youtube-nocookie để không đặt cookie theo dõi trước khi người học chủ động xem.
 */
export function YoutubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border bg-black">
      {playing ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 size-full focus-visible:ring-3 focus-visible:ring-ring/60"
          aria-label={`Phát video: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ i.ytimg.com, không cần tối ưu qua next/image */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            loading="lazy"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 place-items-center rounded-full bg-[color:var(--inst)] text-white shadow-xl transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-1 size-7 fill-current" aria-hidden />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
