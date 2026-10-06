"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";

// Khóa cache tập trung để mutation biết cần invalidate gì
export const qk = {
  entitlements: ["entitlements"] as const,
  plans: ["plans"] as const,
  progress: ["progress"] as const,
  instruments: ["instruments"] as const,
  instrument: (slug: string) => ["instrument", slug] as const,
  lesson: (slug: string, lesson: string) => ["lesson", slug, lesson] as const,
  quiz: (slug: string, lesson: string) => ["quiz", slug, lesson] as const,
  songs: (instrument: string) => ["songs", instrument] as const,
  performances: (page: number) => ["performances", page] as const,
  performance: (id: string) => ["performance", id] as const,
};

export const useEntitlements = () => useQuery({ queryKey: qk.entitlements, queryFn: api.entitlements });
export const usePlans = () => useQuery({ queryKey: qk.plans, queryFn: api.plans, staleTime: 10 * 60_000 });
export const useProgress = () => useQuery({ queryKey: qk.progress, queryFn: api.progress });
export const useInstruments = () =>
  useQuery({ queryKey: qk.instruments, queryFn: api.instruments, staleTime: 10 * 60_000 });
export const useInstrument = (slug: string) =>
  useQuery({ queryKey: qk.instrument(slug), queryFn: () => api.instrument(slug) });
export const useLesson = (slug: string, lesson: string) =>
  useQuery({ queryKey: qk.lesson(slug, lesson), queryFn: () => api.lesson(slug, lesson) });
export const useSongs = (instrument: string | null) =>
  useQuery({ queryKey: qk.songs(instrument ?? ""), queryFn: () => api.songs(instrument!), enabled: !!instrument });
export const usePerformances = (page: number) =>
  useQuery({ queryKey: qk.performances(page), queryFn: () => api.performances(page) });
export const usePerformance = (id: string) =>
  useQuery({ queryKey: qk.performance(id), queryFn: () => api.performance(id) });
