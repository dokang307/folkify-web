import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-[family-name:var(--font-fraunces)] text-7xl font-semibold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Lạc nhịp rồi!</h1>
      <p className="max-w-sm text-muted-foreground">Trang bạn tìm không tồn tại hoặc đã được chuyển đi.</p>
      <Link href="/" className="text-primary hover:underline">Về trang chủ</Link>
    </main>
  );
}
