import DashboardLayout from "@/components/dashboard-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">{children}</div>
    </DashboardLayout>
  )
}
