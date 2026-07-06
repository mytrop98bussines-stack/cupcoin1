export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 pb-10">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
