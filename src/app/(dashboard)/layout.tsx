export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">{/* Bilingual FR/EN sidebar */}</aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
