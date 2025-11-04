/**
 * DetailSkeleton Component
 * Loading skeleton for detail pages with cards and information
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DetailSkeletonProps {
  /** Number of information fields to show in the details card */
  fields?: number;
  /** Whether to show a map card */
  showMap?: boolean;
  /** Whether to show a history/table section */
  showHistory?: boolean;
}

export function DetailSkeleton({
  fields = 7,
  showMap = true,
  showHistory = true,
}: DetailSkeletonProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" /> {/* Back button */}
          <Skeleton className="h-8 w-64" /> {/* Title */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" /> {/* Edit button */}
          <Skeleton className="h-9 w-24" /> {/* Delete button */}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map/First Card */}
        {showMap && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full rounded-lg" />
              <div className="mt-4 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-40" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Information Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: fields }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
            <div className="pt-4 border-t space-y-2">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-48" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History/Table Section */}
      {showHistory && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-4 border-b">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border-b last:border-b-0">
                  <div className="flex gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
