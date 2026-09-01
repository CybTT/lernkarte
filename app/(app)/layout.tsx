import { NavBar } from "@/components/NavBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <NavBar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
