import { Card } from "@/components/ui/card"
import { SkeletonLoader, SkeletonText } from "@/components/ui/skeleton-loader"

export function ProductSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <SkeletonLoader shape="rectangle" className="aspect-square rounded-md" />
        <div className="space-y-2">
          <SkeletonText width="75%" />
          <SkeletonText width="50%" />
        </div>
      </div>
    </Card>
  )
}
