import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return <PageSkeleton stats={4} withChart={false} withTable tableRows={10} />;
}
