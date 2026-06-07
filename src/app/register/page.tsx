"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast-simple"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [email, setEmail] = React.useState("")
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !name || !password || !confirmPassword) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các thông tin bắt buộc.",
        type: "warning"
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.",
        type: "error"
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Đăng ký thất bại",
          description: data.error || "Không thể đăng ký tài khoản.",
          type: "error"
        })
      } else {
        toast({
          title: "Tạo tài khoản thành công",
          description: "Chào mừng bạn gia nhập hệ thống đặt sân bóng!",
          type: "success"
        })

        setTimeout(() => {
          router.push("/customer/bookings")
          router.refresh()
        }, 1000)
      }
    } catch (err) {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến máy chủ.",
        type: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-emerald-950">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/80 backdrop-blur-md shadow-2xl text-zinc-50">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <span className="text-3xl">⚽</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Đăng Ký Tài Khoản</CardTitle>
          <CardDescription className="text-zinc-400">
            Tạo tài khoản khách hàng để đặt sân trực tuyến
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300" htmlFor="name">Họ và tên *</label>
              <Input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300" htmlFor="email">Email đăng nhập *</label>
              <Input
                id="email"
                type="email"
                placeholder="ten@viethu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300" htmlFor="phone">Số điện thoại</label>
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300" htmlFor="password">Mật khẩu *</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300" htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-2">
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
              disabled={loading}
            >
              {loading ? "Đang tạo tài khoản..." : "Đăng ký ngay"}
            </Button>
            <div className="text-center text-xs text-zinc-400">
              Đã có tài khoản khách hàng?{" "}
              <Link href="/login" className="text-emerald-400 hover:underline font-bold">
                Đăng nhập hệ thống
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
