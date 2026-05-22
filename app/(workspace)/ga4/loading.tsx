import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  return <PageSkeleton stats={4} withChart withTable tableRows={6} />;
}
