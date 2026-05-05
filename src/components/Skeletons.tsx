import React from "react";
import { Skeleton } from "./ui/Skeleton";

export function HouseholdSkeleton() {
  return (
    <div className="pb-12 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between py-4 px-2 mb-2">
        <Skeleton className="h-8 w-48 rounded-xl" />
      </header>

      <div className="grid grid-cols-1 gap-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>

      <Skeleton className="h-32 w-full rounded-2xl" />

      <section className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 ml-1" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function RecipesSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="py-4 px-4 -mx-4 mb-2 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-3 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </header>

      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <Skeleton className="h-60 w-full rounded-none" />
            <div className="p-7 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="space-y-3">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-5 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="pb-12 space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between py-4 px-2 mb-2">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </header>

      <div className="space-y-6">
        {/* Personal Info */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="w-8 h-8 rounded-2xl" />
            <Skeleton className="h-5 w-32 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 ml-1 rounded-md" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </section>

        {/* Nutritional Goals */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="w-8 h-8 rounded-2xl" />
            <Skeleton className="h-5 w-48 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20 ml-1 rounded-md" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </section>

        {/* Intolerances */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="w-8 h-8 rounded-2xl" />
            <Skeleton className="h-5 w-40 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full" />
            ))}
          </div>
        </section>

        {/* Pantry */}
        <section className="bg-white rounded-2xl p-6 border border-gray-100/50">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="w-8 h-8 rounded-2xl" />
            <Skeleton className="h-5 w-56 rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </section>
      </div>
    </div>
  );
}
