import { AssignPop } from "@/components/shell/AssignPop";
import { Sidebar } from "@/components/shell/Sidebar";

/* Every screen except setup: sidebar, main column, the assign popover. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="main">{children}</main>
      <AssignPop />
    </>
  );
}
