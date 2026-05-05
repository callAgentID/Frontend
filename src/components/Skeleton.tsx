import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[#1F3A3408] rounded-xl",
        className
      )}
    />
  );
}

// Skeleton for Analytics Call List Item
export function CallListItemSkeleton() {
  return (
    <div className="flex items-center gap-6 p-8 border-b border-[#1f3a3405]">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex items-center gap-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="hidden md:block">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-12 mt-2" />
      </div>
      <Skeleton className="w-11 h-11 rounded-2xl" />
    </div>
  );
}

// Skeleton for Red Flag Item
export function RedFlagItemSkeleton() {
  return (
    <div className="flex items-center gap-6 p-8 border-b border-[#1f3a3405]">
      <Skeleton className="w-16 h-16 rounded-2xl" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-4 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
  );
}

// Skeleton for Campaign Card
export function CampaignCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] border border-[#1f3a3408] p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#1f3a3408]">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for Script Card
export function ScriptCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] border border-[#1f3a3408] p-8 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// Skeleton for Questionnaire Card
export function QuestionnaireCardSkeleton() {
  return (
    <div className="bg-white border border-[#1f3a3408] rounded-[2rem] p-8">
      <div className="flex items-center gap-8">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-8" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-8" />
          </div>
          <Skeleton className="w-12 h-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for Stats Card
export function StatsCardSkeleton() {
  return (
    <div className="p-6 rounded-[2.5rem] bg-white border border-[#1f3a3405] min-w-[200px]">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      <Skeleton className="h-3 w-28 mb-2" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  );
}
