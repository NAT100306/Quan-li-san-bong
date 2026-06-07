"use client"

import * as React from "react"
import { useToast } from "@/components/ui/toast-simple"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Users, Eye, RefreshCw, Calendar, Clock, Award } from "lucide-react"

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
}

interface Pitch {
  name: string;
}

interface CustomerBooking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  pitch: Pitch;
}

export default function AdminCustomersPage() {
  const { toast } = useToast()
  
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [detailLoading, setDetailLoading] = React.useState(false)

  // Detail Dialog states
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null)
  const [selectedBookings, setSelectedBookings] = React.useState<CustomerBooking[]>([])

  const loadCustomers = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/customers")
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers)
      } else {
        toast({ title: "Lỗi tải dữ liệu", description: "Không thể lấy danh sách khách hàng.", type: "error" })
      }
    } catch (e) {
      toast({ description: "Lỗi kết nối máy chủ.", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const handleViewDetails = async (customerId: string) => {
    setDetailLoading(true)
    setIsDetailOpen(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedCustomer(data.customer)
        setSelectedBookings(data.bookings)
      } else {
        toast({ title: "Lỗi tải chi tiết", description: "Không thể tải lịch sử của khách hàng.", type: "error" })
        setIsDetailOpen(false)
      }
    } catch (error) {
      toast({ description: "Lỗi kết nối mạng.", type: "error" })
      setIsDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20";
      case "CONFIRMED": return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-500/20";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-500/20";
      case "COMPLETED": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Khách Hàng</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Danh sách thành viên đăng ký, tần suất đặt sân và tổng chi tiêu</p>
        </div>
        
        <button
          onClick={loadCustomers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Tải lại dữ liệu
        </button>
      </div>

      {/* Customers Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          {!loading || customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Tên khách hàng</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Liên hệ</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Ngày gia nhập</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Tổng số trận đặt</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Số trận hoàn thành</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Tổng chi tiêu</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-zinc-500 dark:text-zinc-400">Lịch sử</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      {c.name}
                    </TableCell>
                    <TableCell>
                      <span className="block text-sm">{c.email}</span>
                      <span className="text-xs text-zinc-500">{c.phone || "—"}</span>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="font-semibold">{c.totalBookings} lần</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{c.completedBookings} trận</TableCell>
                    <TableCell className="font-extrabold text-zinc-950 dark:text-zinc-50">
                      {c.totalSpent.toLocaleString('vi-VN')}đ
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewDetails(c.id)}
                        className="h-8 px-2 cursor-pointer text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                      >
                        <Eye className="h-4 w-4" /> Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-zinc-500">
              Đang tải danh sách thành viên...
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Customer Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent onClose={() => setIsDetailOpen(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Lịch Sử Đặt Sân Của Khách
            </DialogTitle>
            <DialogDescription className="text-xs">
              Chi tiết các trận đấu khách hàng đã đặt trên hệ thống
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 text-center text-sm font-semibold text-emerald-500">
              ⚽ Đang phân tích lịch sử của khách hàng...
            </div>
          ) : (
            selectedCustomer && (
              <div className="space-y-4 my-2">
                {/* Brief Info */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs block">Họ và tên:</span>
                    <span className="font-bold">{selectedCustomer.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block">Số điện thoại:</span>
                    <span className="font-bold">{selectedCustomer.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block">Email liên hệ:</span>
                    <span className="font-bold">{selectedCustomer.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block">Tham gia:</span>
                    <span className="font-bold">{new Date(selectedCustomer.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>

                {/* Booking History Table */}
                <div className="max-h-[280px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  {selectedBookings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-2.5">Sân bóng</TableHead>
                          <TableHead className="py-2.5">Thời gian</TableHead>
                          <TableHead className="py-2.5">Giá tiền</TableHead>
                          <TableHead className="py-2.5">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBookings.map((b) => {
                          const start = new Date(b.startTime)
                          const end = new Date(b.endTime)
                          const date = start.toLocaleDateString("vi-VN")
                          const time = `${start.toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}`

                          return (
                            <TableRow key={b.id}>
                              <TableCell className="py-2.5 font-bold text-xs">{b.pitch.name}</TableCell>
                              <TableCell className="py-2.5 text-xs">
                                <span className="block font-medium">{date}</span>
                                <span className="text-[10px] text-zinc-500 flex items-center gap-0.5 mt-0.5"><Clock className="h-3 w-3" /> {time}</span>
                              </TableCell>
                              <TableCell className="py-2.5 font-semibold text-xs">{b.totalPrice.toLocaleString('vi-VN')}đ</TableCell>
                              <TableCell className="py-2.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(b.status)}`}>
                                  {b.status === "PENDING" ? "Chờ duyệt" : b.status === "CONFIRMED" ? "Đã duyệt" : b.status === "CANCELLED" ? "Đã hủy" : "Đã xong"}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      Khách hàng này chưa thực hiện đặt sân nào.
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => setIsDetailOpen(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
                  >
                    Đóng cửa sổ
                  </Button>
                </DialogFooter>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
