// Ảnh nhạc cụ đóng gói sẵn trong /public/instruments (copy từ landing page).
// DB có image_url trỏ Wikimedia nhưng không ổn định → ưu tiên ảnh local, fallback về DB.
const LOCAL_IMAGES: Record<string, string> = {
  "dan-tranh": "/instruments/dan-tranh.jpg",
  "dan-bau": "/instruments/dan-bau.jpg",
  "dan-nguyet": "/instruments/dan-nguyet.jpg",
  "dan-nhi": "/instruments/dan-nhi.jpg",
  "dan-ty-ba": "/instruments/dan-ty-ba.webp",
  "sao-truc": "/instruments/sao-truc.jpg",
};

export function instrumentImage(slug: string, fallback?: string | null): string | null {
  return LOCAL_IMAGES[slug] ?? fallback ?? null;
}
