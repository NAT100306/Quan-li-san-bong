"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast-simple"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/layout/ThemeToggle"
import { 
  LayoutDashboard, 
  Map, 
  CalendarDays, 
  Users, 
  QrCode, 
  LogOut, 
  Menu, 
  X,
  UserCheck
} from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [adminUser, setAdminUser] = React.useState<{ name: string; role: string } | null>(null)

  React.useEffect(() => {
    // Check Me to get user info
    const checkMe = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (data.user.role !== "ADMIN" && data.user.role !== "STAFF") {
          router.push("/customer/bookings")
          return
        }
        setAdminUser({ name: data.user.name, role: data.user.role })
      } catch (e) {
        router.push("/login")
      }
    }
    checkMe()
  }, [router])

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (res.ok) {
        toast({
          title: "Đăng xuất thành công",
          description: "Tài khoản quản lý đã được đăng xuất.",
          type: "success"
        })
        router.push("/login")
        router.refresh()
      }
    } catch (e) {
      toast({ description: "Lỗi kết nối.", type: "error" })
    }
  }

  const menuItems = [
    { name: "Tổng quan", href: "/admin", icon: LayoutDashboard },
    { name: "Quản lý Sân", href: "/admin/pitches", icon: Map },
    { name: "Quản lý Đặt Sân", href: "/admin/bookings", icon: CalendarDays },
    { name: "Khách Hàng", href: "/admin/customers", icon: Users },
    { name: "QR Check-in", href: "/admin/checkin", icon: QrCode },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="font-extrabold text-sm tracking-tight text-emerald-600 dark:text-emerald-400">
              PITCH MANAGER
            </span>
          </div>
          <button 
            className="lg:hidden p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User profile brief */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{adminUser?.name || "Đang tải..."}</span>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                {adminUser?.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Giao diện Sáng/Tối</span>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 text-red-500 border-red-200 dark:border-red-950 hover:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main page wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 lg:hidden">
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-center font-extrabold text-sm tracking-tight text-emerald-600 dark:text-emerald-400">
            PITCH MANAGER SYSTEM
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  )
}
