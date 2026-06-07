"use client"

import * as React from "react"
import { useToast } from "@/components/ui/toast-simple"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Check, X, CreditCard, RefreshCw, Plus, Clock, Phone, Mail } from "lucide-react"

interface Pitch {
  id: string;
  name: string;
  pricePerHour: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

interface Booking {
  id: string;
  pitchId: string;
  customerId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  checkInStatus: boolean;
  pitch: Pitch;
  customer: Customer;
  payments: Payment[];
}

export default function AdminBookingsPage() {
  const { toast } = useToast()
  
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [pitches, setPitches] = React.useState<Pitch[]>([])
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = React.useState("")
  
  // Create Dialog state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [selectedCustomer, setSelectedCustomer] = React.useState("")
  const [selectedPitch, setSelectedPitch] = React.useState("")
  const [bookingDate, setBookingDate] = React.useState("")
  const [startHour, setStartHour] = React.useState("18:00")
  const [endHour, setEndHour] = React.useState("19:30")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      // 1. Get Bookings with optional status filter
      const url = statusFilter ? `/api/bookings?status=${statusFilter}` : '/api/bookings'
      const bookingRes = await fetch(url)
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json()
        setBookings(bookingData.bookings)
      }

      // 2. Get Pitches
      const pitchRes = await fetch("/api/pitches")
      if (pitchRes.ok) {
        const pitchData = await pitchRes.json()
        setPitches(pitchData.pitches.filter((p: any) => p.status === "ACTIVE"))
        if (pitchData.pitches.length > 0 && !selectedPitch) {
          setSelectedPitch(pitchData.pitches[0].id)
        }
      }

      // 3. Get Customers (Users with CUSTOMER role)
      const userRes = await fetch("/api/customers")
      if (userRes.ok) {
        const userData = await userRes.json()
        setCustomers(userData.customers)
        if (userData.customers.length > 0 && !selectedCustomer) {
          setSelectedCustomer(userData.customers[0].id)
        }
      }
    } catch (e) {
      toast({ description: "Lỗi kết nối máy chủ.", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, selectedPitch, selectedCustomer, toast])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Lỗi cập nhật", description: data.error || "Không thể cập nhật trạng thái.", type: "error" })
      } else {
        toast({ title: "Cập nhật thành công", description: `Lịch đặt sân đã chuyển sang: ${status}`, type: "success" })
        loadData()
      }
    } catch (error) {
      toast({ description: "Lỗi kết nối.", type: "error" })
    }
  }

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Lỗi thanh toán", description: data.error || "Không thể duyệt thanh toán.", type: "error" })
      } else {
        toast({ title: "Duyệt thanh toán", description: "Đã xác nhận thanh toán thành công.", type: "success" })
        loadData()
      }
    } catch (error) {
      toast({ description: "Lỗi kết nối.", type: "error" })
    }
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer || !selectedPitch || !bookingDate) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng chọn khách hàng, sân bóng và ngày đặt.", type: "warning" })
      return
    }

    const startTimeStr = `${bookingDate}T${startHour}:00`
    const endTimeStr = `${bookingDate}T${endHour}:00`

    const start = new Date(startTimeStr)
    const end = new Date(endTimeStr)

    if (start >= end) {
      toast({ title: "Giờ đặt lỗi", description: "Giờ bắt đầu phải trước giờ kết thúc.", type: "error" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitchId: selectedPitch,
          customerId: selectedCustomer,
          startTime: startTimeStr,
          endTime: endTimeStr,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Đặt sân lỗi", description: data.error || "Sân đã bị trùng lịch.", type: "error" })
      } else {
        toast({ title: "Đặt sân thành công", description: "Lịch đặt sân hộ khách đã được ghi nhận.", type: "success" })
        setIsCreateOpen(false)
        setBookingDate("")
        loadData()
      }
    } catch (error) {
      toast({ description: "Lỗi kết nối.", type: "error" })
    } finally {
      setSubmitting(false)
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
          <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Đặt Sân</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Duyệt yêu cầu đặt lịch, quản lý thanh toán và tạo lịch đặt trực tiếp</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="CONFIRMED">Đã duyệt</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </Select>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" /> Đặt hộ khách
          </Button>
        </div>
      </div>

      {/* Bookings Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          {!loading || bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Khách hàng</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Sân bóng</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Khung giờ đá</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Tổng tiền</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Trạng thái đặt</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Thanh toán</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-zinc-500 dark:text-zinc-400">Duyệt lịch</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const start = new Date(booking.startTime)
                  const end = new Date(booking.endTime)
                  const dateFormatted = start.toLocaleDateString("vi-VN")
                  const timeRange = `${start.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}`

                  // Lấy thông tin payment
                  const cashPayment = booking.payments.find((p) => p.paymentMethod === 'CASH')
                  const onlinePayment = booking.payments.find((p) => p.paymentMethod !== 'CASH')

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <span className="block font-bold">{booking.customer?.name}</span>
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {booking.customer?.phone || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold">{booking.pitch?.name}</TableCell>
                      <TableCell>
                        <span className="block font-medium">{dateFormatted}</span>
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3.5 w-3.5" /> {timeRange}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold">{Number(booking.totalPrice).toLocaleString('vi-VN')}đ</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                          {booking.status === "PENDING" ? "Chờ duyệt" : booking.status === "CONFIRMED" ? "Đã duyệt" : booking.status === "CANCELLED" ? "Đã hủy" : "Đã xong"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {booking.payments.length > 0 ? (
                          <div className="space-y-1">
                            {booking.payments.map((p) => (
                              <div key={p.id} className="flex items-center gap-1.5 text-xs">
                                <span className="font-semibold">{p.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}:</span>
                                {p.status === 'PENDING' ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-amber-500 font-bold">Chờ thu</span>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleConfirmPayment(p.id)}
                                      className="h-5 px-1 py-0 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                    >
                                      Thu tiền
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-emerald-500 font-bold">Đã thu</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">Không có hóa đơn</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {booking.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                                className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                                className="h-8 w-8 p-0 border-red-200 dark:border-red-950 text-red-500 hover:bg-red-500/10 cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                              className="h-8 px-2 border-red-200 text-red-500 hover:bg-red-500/10 cursor-pointer"
                            >
                              Hủy lịch
                            </Button>
                          )}
                          {booking.status === "COMPLETED" && (
                            <span className="text-xs text-emerald-500 font-bold">✓ Đã Check-in</span>
                          )}
                          {booking.status === "CANCELLED" && (
                            <span className="text-xs text-zinc-400 line-through">Lịch đã hủy</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-zinc-500">
              Đang tải danh sách đặt sân hoặc không tìm thấy lịch nào...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book on behalf of customer Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Đặt Lịch Sân Hộ Khách</DialogTitle>
            <DialogDescription className="text-xs">
              Dành cho nhân viên ghi nhận lịch khi khách gọi điện hoặc đến đặt trực tiếp tại quầy.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBooking} className="space-y-4 my-2">
            
            {/* Khách hàng */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">Chọn khách hàng *</label>
              <Select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                disabled={submitting}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </Select>
            </div>

            {/* Sân bóng */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">Chọn sân trống *</label>
              <Select
                value={selectedPitch}
                onChange={(e) => setSelectedPitch(e.target.value)}
                disabled={submitting}
              >
                {pitches.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Ngày đặt */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">Ngày đá *</label>
              <Input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                disabled={submitting}
                className="cursor-pointer"
              />
            </div>

            {/* Giờ đá */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500">Giờ bắt đầu</label>
                <Select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  disabled={submitting}
                >
                  {Array.from({ length: 19 }, (_, i) => {
                    const h = i + 5;
                    return [`${h}:00`, `${h}:30`]
                  }).flat().map((time) => (
                    <option key={`start-${time}`} value={time}>{time}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500">Giờ kết thúc</label>
                <Select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  disabled={submitting}
                >
                  {Array.from({ length: 19 }, (_, i) => {
                    const h = i + 5;
                    return [`${h}:00`, `${h}:30`]
                  }).flat().map((time) => (
                    <option key={`end-${time}`} value={time}>{time}</option>
                  ))}
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 font-bold cursor-pointer"
                disabled={submitting}
              >
                {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
