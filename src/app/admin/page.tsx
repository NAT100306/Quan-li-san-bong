"use client"

import * as React from "react"
import { useToast } from "@/components/ui/toast-simple"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { DollarSign, Calendar, Activity, Users, ArrowRight, RefreshCw } from "lucide-react"
import Link from "next/link"

// Import Recharts động hoặc render client-safe
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Stats {
  currentMonthRevenue: number;
  monthlyBookingsCount: number;
  activePitchesCount: number;
  totalCustomersCount: number;
}

interface RecentBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  pitchName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
}

interface ChartData {
  month: string;
  revenue: number;
}

export default function AdminDashboardPage() {
  const { toast } = useToast()
  
  const [stats, setStats] = React.useState<Stats>({
    currentMonthRevenue: 0,
    monthlyBookingsCount: 0,
    activePitchesCount: 0,
    totalCustomersCount: 0,
  })
  const [recentBookings, setRecentBookings] = React.useState<RecentBooking[]>([])
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isClient, setIsClient] = React.useState(false)

  // Khắc phục hydration mismatch cho Recharts
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard")
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentBookings(data.recentBookings)
        setChartData(data.monthlyRevenueChart)
      } else {
        toast({
          title: "Lỗi tải thông tin",
          description: "Không thể lấy số liệu thống kê Dashboard.",
          type: "error"
        })
      }
    } catch (e) {
      toast({ description: "Lỗi kết nối máy chủ.", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20";
      case "CONFIRMED": return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-500/20";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-500/20";
      case "COMPLETED": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "Chờ duyệt";
      case "CONFIRMED": return "Đã duyệt";
      case "CANCELLED": return "Đã hủy";
      case "COMPLETED": return "Hoàn thành";
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Thống kê hoạt động sân bóng mini và doanh thu thực tế</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Tải lại dữ liệu
        </button>
      </div>

      {/* Grid Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Doanh thu */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Doanh thu tháng này</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.currentMonthRevenue.toLocaleString('vi-VN')}đ
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Từ các thanh toán đã hoàn thành</p>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Đặt sân mới trong tháng</CardTitle>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{stats.monthlyBookingsCount} lịch</div>
            <p className="text-[10px] text-zinc-500 mt-1">Ngoại trừ lịch đặt đã hủy</p>
          </CardContent>
        </Card>

        {/* Active Pitches */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sân đang hoạt động</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{stats.activePitchesCount} sân</div>
            <p className="text-[10px] text-zinc-500 mt-1">Sẵn sàng nhận khách hàng đặt</p>
          </CardContent>
        </Card>

        {/* Customers count */}
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Khách đăng ký</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{stats.totalCustomersCount} thành viên</div>
            <p className="text-[10px] text-zinc-500 mt-1">Đăng ký tài khoản online</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Chart */}
        <div className="lg:col-span-8">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Biểu Đồ Doanh Thu Năm Nay</CardTitle>
              <CardDescription>Số liệu tổng hợp doanh thu hoàn thành theo từng tháng</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] flex items-center justify-center">
              {isClient ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", color: "#fafafa" }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-zinc-400 text-sm">Đang tải biểu đồ...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick actions / stats summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Liên kết nhanh</CardTitle>
              <CardDescription>Các nghiệp vụ quản lý thường gặp</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <Link 
                href="/admin/checkin"
                className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-sm font-semibold transition-all group"
              >
                <span>Quét mã QR Check-in khách</span>
                <ArrowRight className="h-4 w-4 text-emerald-500 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/admin/bookings"
                className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-sm font-semibold transition-all group"
              >
                <span>Xem & Duyệt lịch đặt sân</span>
                <ArrowRight className="h-4 w-4 text-emerald-500 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/admin/pitches"
                className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-sm font-semibold transition-all group"
              >
                <span>Điều chỉnh giá, bảo trì sân</span>
                <ArrowRight className="h-4 w-4 text-emerald-500 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row: Recent Bookings Table */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <div>
            <CardTitle className="text-lg font-bold">Đặt Sân Gần Nhất</CardTitle>
            <CardDescription>Lịch đặt sân bóng mới nhất gửi lên hệ thống</CardDescription>
          </div>
          <Link href="/admin/bookings" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Xem tất cả
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sân bóng</TableHead>
                  <TableHead>Khung giờ</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((b) => {
                  const start = new Date(b.startTime)
                  const end = new Date(b.endTime)
                  const formatTime = `${start.toLocaleDateString("vi-VN")} ${start.toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}`

                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <span className="block font-bold">{b.customerName}</span>
                        <span className="text-xs text-zinc-500">{b.customerPhone || "Chưa có SĐT"}</span>
                      </TableCell>
                      <TableCell className="font-semibold">{b.pitchName}</TableCell>
                      <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">{formatTime}</TableCell>
                      <TableCell className="font-bold">{b.totalPrice.toLocaleString('vi-VN')}đ</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(b.status)}`}>
                          {getStatusText(b.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-zinc-500">
              Chưa có đặt sân bóng nào gần đây.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
