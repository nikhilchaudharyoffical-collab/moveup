import { isAdminAuthed } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const authed = await isAdminAuthed();

  return (
    <div className="min-h-full flex-1 bg-[#0a0a0a] px-4 py-10">
      {authed ? <AdminDashboard /> : <AdminLogin />}
    </div>
  );
}

