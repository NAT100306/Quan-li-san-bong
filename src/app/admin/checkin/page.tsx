"use client"

import * as React from "react"
import { useToast } from "@/components/ui/toast-simple"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { QrCode, Camera, ShieldCheck, User, MapPin, Clock, DollarSign, AlertCircle } from "lucide-react"

// Import html5-qrcode
import { Html5QrcodeScanner } from "html5-qrcode"

interface BookingInfo {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  checkInAt: string;
  pitch: { name: string };
  customer: { name: string; phone: string; email: string };
}

export default function AdminCheckinPage() {
  const { toast } = useToast()
  
  const [manualCode, setManualCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [scannedBooking, setScannedBooking] = React.useState<BookingInfo | null>(null)
  
  // Camera state
  const [cameraActive, setCameraActive] = React.useState(false)

  React.useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null

    if (cameraActive) {
      // Khởi tạo camera scanner
      scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      )

      scanner.render(
        async (decodedText) => {
          // Khi quét thành công mã QR
          setCameraActive(false) // Tắt camera
          if (scanner) scanner.clear()
          
          await triggerCheckin(decodedText)
        },
        (error) => {
          // Bỏ qua log lỗi quét trượt định kỳ để đỡ spam console
        }
      )
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((error) => {
          console.error("Failed to clear scanner on unmount:", error)
        })
      }
    }
  }, [cameraActive])

  const triggerCheckin = async (code: string) => {
    if (!code) return
    setSubmitting(true)
    setScannedBooking(null)
    
    try {
      const res = await fetch("/api/bookings/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInCode: code.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Check-in thất bại",
          description: data.error || "Mã check-in không hợp lệ hoặc đã sử dụng.",
          type: "error"
        })
        if (data.booking) {
          // Lưu lại booking cũ để nhân viên xem tại sao lỗi (ví dụ đã checkin rồi)
          setScannedBooking(data.booking)
        }
      } else {
        toast({
          title: "Check-in thành công!",
          description: "Khách hàng đã được duyệt vào sân đá bóng.",
          type: "success"
        })
        setScannedBooking(data.booking)
        setManualCode("")
      }
    } catch (error) {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể gửi yêu cầu check-in đến hệ thống.",
        type: "error"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode) {
      toast({ description: "Vui lòng nhập mã check-in.", type: "warning" })
      return
    }
    triggerCheckin(manualCode)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Title */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">QR Check-in Sân Bóng</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Sử dụng camera quét mã QR của khách hoặc nhập mã vé thủ công để check-in</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: QR Scanner or Manual Form */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-500" />
                Quét Mã QR Nhận Sân
              </CardTitle>
              <CardDescription>Bật camera để quét mã QR check-in của khách hàng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {cameraActive ? (
                <div className="space-y-4">
                  <div id="reader" className="w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-900" />
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer text-red-500 border-red-200 dark:border-red-950 hover:bg-red-500/10"
                    onClick={() => setCameraActive(false)}
                  >
                    Tắt Camera
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setCameraActive(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-24 flex flex-col gap-2 cursor-pointer shadow-md hover:shadow-emerald-500/15"
                >
                  <Camera className="h-7 w-7" />
                  <span>Mở Camera Quét QR</span>
                </Button>
              )}

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
                <span className="flex-shrink mx-4 text-zinc-400 text-xs font-bold uppercase">Hoặc</span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Nhập mã check-in thủ công</label>
                  <Input
                    placeholder="Nhập mã check-in..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full border-zinc-300 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 font-bold"
                  disabled={submitting}
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận mã"}
                </Button>
              </form>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Scanned Result Details */}
        <div className="md:col-span-7">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md h-full flex flex-col justify-between">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                Thông Tin Trận Đấu Được Check-in
              </CardTitle>
              <CardDescription>Kết quả kiểm tra trạng thái vé đặt sân gần nhất</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center items-center">
              {scannedBooking ? (
                <div className="w-full space-y-6">
                  
                  {/* Status Banner */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-6 w-6 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm block">Đã hoàn tất Check-in!</span>
                      <span className="text-[11px] opacity-90">Thời gian check-in: {new Date(scannedBooking.checkInAt || new Date()).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>

                  {/* Booking details list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex gap-2.5 items-start">
                      <MapPin className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-zinc-500 block">Sân bóng đã đặt:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-50">{scannedBooking.pitch?.name}</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <User className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-zinc-500 block">Khách hàng đá:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-50">{scannedBooking.customer?.name}</span>
                        <span className="text-[11px] text-zinc-500 block">{scannedBooking.customer?.phone || "Không có SĐT"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <Clock className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-zinc-500 block">Khung giờ đặt lịch:</span>
                        <span className="font-bold">
                          {new Date(scannedBooking.startTime).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})} - {new Date(scannedBooking.endTime).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}
                        </span>
                        <span className="text-xs text-zinc-500 block">Ngày: {new Date(scannedBooking.startTime).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <DollarSign className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-zinc-500 block">Tổng thanh toán:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">{Number(scannedBooking.totalPrice).toLocaleString('vi-VN')}đ</span>
                        <span className="text-[10px] text-emerald-500 font-bold block">✓ Đã thu tiền (Hoàn tất)</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center space-y-2 py-12">
                  <AlertCircle className="h-10 w-10 text-zinc-300 dark:text-zinc-800 mx-auto" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Chưa có thông tin check-in</p>
                  <p className="text-zinc-400 dark:text-zinc-600 text-xs">Vui lòng bật camera để quét mã QR từ điện thoại của khách hàng hoặc nhập mã check-in tay.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
