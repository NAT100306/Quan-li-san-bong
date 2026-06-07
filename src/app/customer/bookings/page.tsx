"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast-simple"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { QrCode, LogOut, Calendar, Plus, RefreshCw, Clock, DollarSign } from "lucide-react"
import ThemeToggle from "@/components/layout/ThemeToggle"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Pitch {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
}

interface Booking {
  id: string;
  pitchId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  checkInCode: string;
  checkInStatus: boolean;
  pitch: Pitch;
}

export default function CustomerBookingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [user, setUser] = React.useState<User | null>(null)
  const [pitches, setPitches] = React.useState<Pitch[]>([])
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  // Booking Form States
  const [selectedPitch, setSelectedPitch] = React.useState("")
  const [bookingDate, setBookingDate] = React.useState("")
  const [startHour, setStartHour] = React.useState("17:00")
  const [endHour, setEndHour] = React.useState("18:30")

  // QR Modal States
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null)
  const [isQrOpen, setIsQrOpen] = React.useState(false)

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      // 1. Get Me
      const meRes = await fetch("/api/auth/me")
      if (!meRes.ok) {
        router.push("/login")
        return
      }
      const meData = await meRes.json()
      setUser(meData.user)

      // 2. Get Pitches
      const pitchRes = await fetch("/api/pitches")
      if (pitchRes.ok) {
        const pitchData = await pitchRes.json()
        setPitches(pitchData.pitches.filter((p: any) => p.status === "ACTIVE"))
        if (pitchData.pitches.length > 0) {
          setSelectedPitch(pitchData.pitches[0].id)
        }
      }

      // 3. Get Bookings
      const bookingRes = await fetch("/api/bookings")
      if (bookingRes.ok) {
        const bookingData = await bookingRes.json()
        setBookings(bookingData.bookings)
      }
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy thông tin từ hệ thống.",
        type: "error"
      })
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (res.ok) {
        toast({
          title: "Đăng xuất",
          description: "Đăng xuất tài khoản khách hàng thành công.",
          type: "success"
        })
        router.push("/login")
        router.refresh()
      }
    } catch (e) {
      toast({ description: "Có lỗi xảy ra khi đăng xuất.", type: "error" })
    }
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPitch || !bookingDate || !startHour || !endHour) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn đầy đủ sân, ngày và khung giờ.",
        type: "warning"
      })
      return
    }

    const startTimeStr = `${bookingDate}T${startHour}:00`
    const endTimeStr = `${bookingDate}T${endHour}:00`

    const start = new Date(startTimeStr)
    const end = new Date(endTimeStr)

    if (start >= end) {
      toast({
        title: "Thời gian không hợp lệ",
        description: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.",
        type: "error"
      })
      return
    }

    if (start < new Date()) {
      toast({
        title: "Thời gian không hợp lệ",
        description: "Không thể đặt lịch trong quá khứ.",
        type: "error"
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitchId: selectedPitch,
          startTime: startTimeStr,
          endTime: endTimeStr,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Đặt sân thất bại",
          description: data.error || "Khung giờ này đã bị trùng lịch.",
          type: "error"
        })
      } else {
        toast({
          title: "Đặt sân thành công",
          description: "Lịch đặt của bạn đang chờ duyệt. Mã QR đã gửi về email.",
          type: "success"
        })
        // Reset form và load lại
        setBookingDate("")
        fetchData()
      }
    } catch (err) {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể gửi yêu cầu đặt sân.",
        type: "error"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy lịch đặt sân này không?")) return

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Lỗi hủy lịch",
          description: data.error || "Không thể hủy lịch đặt sân.",
          type: "error"
        })
      } else {
        toast({
          title: "Đã hủy đặt sân",
          description: "Hủy lịch đặt sân thành công.",
          type: "success"
        })
        fetchData()
      }
    } catch (error) {
      toast({ description: "Lỗi kết nối mạng.", type: "error" })
    }
  }

  const openQrModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsQrOpen(true)
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

  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-emerald-500 text-lg font-bold">
        ⚽ Đang tải thông tin khách hàng...
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-extrabold text-lg tracking-tight text-emerald-600 dark:text-emerald-400">
              PITCH CUSTOMER
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="font-bold text-zinc-900 dark:text-zinc-50">{user?.name}</span>
              <span className="text-zinc-500 dark:text-zinc-400">{user?.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 cursor-pointer text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Booking Form */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Đặt Sân Trực Tuyến
              </CardTitle>
              <CardDescription>
                Chọn sân, ngày và khung giờ bạn muốn thi đấu
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateBooking}>
              <CardContent className="space-y-4">
                
                {/* Pitch Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Chọn sân bóng</label>
                  <Select
                    value={selectedPitch}
                    onChange={(e) => setSelectedPitch(e.target.value)}
                    disabled={submitting}
                  >
                    {pitches.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ({Number(p.pricePerHour).toLocaleString('vi-VN')}đ/h)
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Ngày đặt sân</label>
                  <Input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    disabled={submitting}
                    className="cursor-pointer"
                  />
                </div>

                {/* Time range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Giờ đá đầu</label>
                    <Select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      disabled={submitting}
                    >
                      {Array.from({ length: 19 }, (_, i) => {
                        const h = i + 5; // 5 AM to 11 PM
                        return [`${h}:00`, `${h}:30`]
                      }).flat().map((time) => (
                        <option key={`start-${time}`} value={time}>{time}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Giờ kết thúc</label>
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

              </CardContent>
              
              <div className="p-6 pt-0">
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý đặt sân..." : "Gửi yêu cầu đặt lịch"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Bookings List */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Lịch Sử Đặt Sân</CardTitle>
                <CardDescription>
                  Danh sách sân bóng bạn đã đặt trên hệ thống
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="h-8 w-8 p-0 cursor-pointer"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sân bóng</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const start = new Date(booking.startTime)
                      const end = new Date(booking.endTime)
                      const dateFormatted = start.toLocaleDateString("vi-VN")
                      const timeRange = `${start.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}`

                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-bold">{booking.pitch?.name}</TableCell>
                          <TableCell>
                            <span className="block font-medium">{dateFormatted}</span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" /> {timeRange}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                            {Number(booking.totalPrice).toLocaleString('vi-VN')}đ
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                              {booking.status === "PENDING" ? "Chờ duyệt" : booking.status === "CONFIRMED" ? "Đã duyệt" : booking.status === "CANCELLED" ? "Đã hủy" : "Đã xong"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {/* QR Button */}
                              {booking.status !== "CANCELLED" && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openQrModal(booking)}
                                  className="h-8 px-2 cursor-pointer flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                                >
                                  <QrCode className="h-4 w-4" /> QR
                                </Button>
                              )}
                              
                              {/* Cancel Button */}
                              {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="h-8 px-2 border-red-200 dark:border-red-950 text-red-500 hover:bg-red-500/10 cursor-pointer"
                                >
                                  Hủy
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  ⚽ Bạn chưa đặt lịch sân bóng nào. Hãy điền form bên trái để đặt trận đấu đầu tiên!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>

      {/* QR Modal (Dialog) */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        {selectedBooking && (
          <DialogContent onClose={() => setIsQrOpen(false)} className="max-w-sm">
            <DialogHeader className="text-center space-y-1">
              <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-500" />
                Mã QR Check-in Sân
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Hãy đưa mã QR này cho nhân viên khi đến sân bóng
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl my-4 border border-zinc-100 dark:border-zinc-800">
              <QRCodeSVG
                value={selectedBooking.checkInCode}
                size={200}
                level="H"
                includeMargin={true}
                className="bg-white p-2 rounded-lg"
              />
              <span className="mt-4 font-mono font-bold text-sm bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 rounded text-zinc-800 dark:text-zinc-200 tracking-wider">
                {selectedBooking.checkInCode}
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sân bóng:</span>
                <span className="font-bold">{selectedBooking.pitch?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Ngày đặt:</span>
                <span className="font-bold">
                  {new Date(selectedBooking.startTime).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Khung giờ:</span>
                <span className="font-bold">
                  {new Date(selectedBooking.startTime).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})} - {new Date(selectedBooking.endTime).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Check-in:</span>
                <span className={`font-bold ${selectedBooking.checkInStatus ? "text-emerald-500" : "text-amber-500"}`}>
                  {selectedBooking.checkInStatus ? "Đã Check-in" : "Chưa Check-in"}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsQrOpen(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
              >
                Đóng lại
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
