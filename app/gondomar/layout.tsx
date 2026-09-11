import { BottomNav } from "@/components/BottomNav";

export default function GondomarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
