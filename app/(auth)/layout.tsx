import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:block" style={{ "--inst": "var(--gold)" } as React.CSSProperties}>
        <Image src="/instruments/dan-tranh.jpg" alt="" fill priority sizes="55vw" className="object-cover opacity-35 mix-blend-luminosity" />
        <div aria-hidden className="strings-motif absolute inset-0 opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">Folkify</Link>
          <blockquote className="max-w-md space-y-4">
            <p className="font-[family-name:var(--font-fraunces)] text-4xl leading-tight">
              Mỗi ngày một bài, tiếng đàn dân tộc sẽ thành tiếng của bạn.
            </p>
            <p className="text-primary-foreground/75">
              Học qua video, ôn lý thuyết bằng câu hỏi ngắn và để AI nghe, chấm điểm phần trình diễn của bạn.
            </p>
          </blockquote>
          <p className="text-sm text-primary-foreground/60">Đàn tranh · Đàn bầu · Đàn nhị · Đàn tỳ bà · Sáo trúc</p>
        </div>
      </aside>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
