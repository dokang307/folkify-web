"use client";

import { Mic, RotateCcw, Send, Square, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/auth/use-session";
import { formatSeconds } from "@/lib/format";
import {
  ACCEPTED_UPLOAD_TYPES,
  COUNTDOWN_SECONDS,
  MAX_SECONDS,
  MIN_SECONDS,
  micErrorMessage,
  pickRecordingFormat,
  validateUpload,
} from "@/lib/recording";
import { cn } from "@/lib/utils";

export interface Take {
  blob: Blob;
  filename: string;
  seconds: number | null;
}

type ReviewTake = Take & { url: string };

function withPreview(take: Take): ReviewTake {
  return { ...take, url: URL.createObjectURL(take.blob) };
}

type Phase = "idle" | "countdown" | "recording" | "review";

/** Ghi âm trực tiếp (có sóng âm live) hoặc tải file lên → trả về một "take" để gửi chấm điểm. */
export function Recorder({
  disabled,
  submitting,
  onSubmit,
}: {
  disabled?: boolean;
  submitting?: boolean;
  onSubmit: (take: Take) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(COUNTDOWN_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState<ReviewTake | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formatUnsupported, setFormatUnsupported] = useState(false);
  const hydrated = useHydrated();
  const canRecord =
    hydrated && !formatUnsupported && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dọn micro/AudioContext khi rời trang giữa chừng
  useEffect(() => () => teardown(), []);

  // Giải phóng object URL của bản ghi cũ khi đổi bản ghi hoặc unmount
  useEffect(() => () => {
    if (take) URL.revokeObjectURL(take.url);
  }, [take]);

  function teardown() {
    timersRef.current.forEach((t) => window.clearInterval(t));
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
  }

  function drawWaveform(analyser: AnalyserNode) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const data = new Uint8Array(analyser.fftSize);
    const color = getComputedStyle(canvas).color;
    const render = () => {
      analyser.getByteTimeDomainData(data);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * width;
        const y = (data[i] / 255) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  }

  async function start() {
    setError(null);
    const format = pickRecordingFormat((m) => MediaRecorder.isTypeSupported(m));
    if (!format) {
      setFormatUnsupported(true);
      setError("Trình duyệt này không hỗ trợ ghi âm. Hãy tải file ghi âm lên.");
      return;
    }
    let stream: MediaStream;
    try {
      // Tắt xử lý giọng nói: khử ồn/tự chỉnh âm lượng làm méo cao độ nhạc cụ
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (err) {
      setError(micErrorMessage(err));
      return;
    }
    streamRef.current = stream;

    setPhase("countdown");
    setCount(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;
    const countdown = window.setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        window.clearInterval(countdown);
        beginRecording(stream, format);
      }
    }, 1000);
    timersRef.current.push(countdown);
  }

  function beginRecording(stream: MediaStream, format: { mime: string; ext: string }) {
    const recorder = new MediaRecorder(stream, { mimeType: format.mime });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => {
      const seconds = (performance.now() - startedAtRef.current) / 1000;
      teardown();
      if (seconds < MIN_SECONDS) {
        setError(`Bản ghi quá ngắn — hãy chơi ít nhất ${MIN_SECONDS} giây.`);
        setPhase("idle");
        return;
      }
      setTake(withPreview({ blob: new Blob(chunks, { type: format.mime }), filename: `ghi-am.${format.ext}`, seconds }));
      setPhase("review");
    };
    recorderRef.current = recorder;

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = audioCtx;

    recorder.start(250);
    startedAtRef.current = performance.now();
    setElapsed(0);
    setPhase("recording");
    requestAnimationFrame(() => drawWaveform(analyser));
    const ticker = window.setInterval(() => {
      const s = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(s);
      if (s >= MAX_SECONDS) stop();
    }, 200);
    timersRef.current.push(ticker);
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function reset() {
    teardown();
    setTake(null);
    setError(null);
    setPhase("idle");
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const problem = validateUpload(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setTake(withPreview({ blob: file, filename: file.name, seconds: null }));
    setPhase("review");
  }

  const progress = Math.min(1, elapsed / MAX_SECONDS);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="relative grid h-36 place-items-center overflow-hidden rounded-xl bg-[color:var(--inst)]/6">
        {phase === "recording" ? (
          <>
            <canvas ref={canvasRef} width={1200} height={288} className="absolute inset-0 size-full text-[color:var(--inst)]" aria-hidden />
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-sm font-medium tabular">
              <span className="size-2 animate-pulse rounded-full bg-lacquer" aria-hidden />
              {formatSeconds(elapsed)} / {formatSeconds(MAX_SECONDS)}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
              <div className="h-full bg-[color:var(--inst)] transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        ) : phase === "countdown" ? (
          <p className="font-[family-name:var(--font-fraunces)] text-6xl font-semibold text-[color:var(--inst)] tabular" aria-live="assertive">
            {count}
          </p>
        ) : phase === "review" && take ? (
          <div className="w-full space-y-2 px-4">
            <p className="text-center text-sm text-muted-foreground">
              {take?.seconds ? `Bản ghi ${formatSeconds(take.seconds)}` : take?.filename} — nghe lại trước khi gửi
            </p>
            <audio src={take.url} controls className="w-full" />
          </div>
        ) : (
          <div className="space-y-1 px-6 text-center">
            <Mic className="mx-auto size-7 text-[color:var(--inst)]" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Đặt micro gần nhạc cụ, chọn nơi yên tĩnh. Ghi từ {MIN_SECONDS} giây đến {MAX_SECONDS / 60} phút — một đoạn hoặc cả bài.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {phase === "idle" && (
          <>
            {canRecord && (
              <Button size="lg" className="h-11 px-5" disabled={disabled} onClick={start}>
                <Mic aria-hidden /> Bắt đầu ghi âm
              </Button>
            )}
            <Button size="lg" variant="outline" className="h-11 px-5" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
              <Upload aria-hidden /> Tải file lên
            </Button>
          </>
        )}
        {phase === "countdown" && (
          <Button size="lg" variant="ghost" className="h-11" onClick={reset}>Hủy</Button>
        )}
        {phase === "recording" && (
          <Button size="lg" className={cn("h-11 px-5", elapsed < MIN_SECONDS && "opacity-70")} onClick={stop}>
            <Square className="fill-current" aria-hidden /> Dừng {elapsed < MIN_SECONDS && `(tối thiểu ${MIN_SECONDS}s)`}
          </Button>
        )}
        {phase === "review" && take && (
          <>
            <Button
              size="lg"
              className="h-11 px-5"
              disabled={disabled || submitting}
              onClick={() => onSubmit({ blob: take.blob, filename: take.filename, seconds: take.seconds })}
            >
              <Send aria-hidden /> {submitting ? "Đang chấm điểm…" : "Gửi AI chấm điểm"}
            </Button>
            <Button size="lg" variant="ghost" className="h-11" disabled={submitting} onClick={reset}>
              <RotateCcw aria-hidden /> Làm lại
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_UPLOAD_TYPES}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
