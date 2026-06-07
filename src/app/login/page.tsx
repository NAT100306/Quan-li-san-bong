"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/toast-simple"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const callbackUrl = searchParams.get("callbackUrl") || ""

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Lỗi đăng nhập",
        description: "Vui lòng nhập đầy đủ email và mật khẩu.",
        type: "error"
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Đăng nhập thất bại",
          description: data.error || "Tài khoản hoặc mật khẩu không chính xác.",
          type: "error"
        })
      } else {
        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng ${data.user.name} đã quay trở lại!`,
          type: "success"
        })

        // Chuyển hướng theo role
        setTimeout(() => {
          if (callbackUrl) {
            router.push(callbackUrl)
            router.refresh()
            return
          }

          if (data.user.role === "ADMIN" || data.user.role === "STAFF") {
            router.push("/admin")
          } else {
            router.push("/customer/bookings")
          }
          router.refresh()
        }, 800)
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
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/80 backdrop-blur-md shadow-2xl text-zinc-50">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <span className="text-3xl">⚽</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Đăng Nhập Hệ Thống</CardTitle>
        <CardDescription className="text-zinc-400">
          Nhập tài khoản quản lý hoặc khách hàng để tiếp tục
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300" htmlFor="email">Email đăng nhập</label>
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
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-300" htmlFor="password">Mật khẩu</label>
              <span className="text-[11px] text-zinc-500 hover:text-emerald-400 cursor-pointer">Quên mật khẩu?</span>
            </div>
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 mt-2">
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
          </Button>
          <div className="text-center text-xs text-zinc-400">
            Chưa có tài khoản khách hàng?{" "}
            <Link href="/register" className="text-emerald-400 hover:underline font-bold">
              Đăng ký tài khoản
            </Link>
          </div>
          <div className="text-center text-[10px] text-zinc-500 mt-2 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/50">
            <span className="font-semibold block text-zinc-400 mb-1">Tài khoản demo test nhanh:</span>
            Admin: admin@gmail.com / admin123 <br />
            Staff: staff@gmail.com / staff123 <br />
            Khách: customer@gmail.com / customer123
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-emerald-950">
      <React.Suspense fallback={
        <div className="text-center p-6 bg-zinc-950 text-emerald-500 font-bold">
          ⚽ Đang kết nối bảo mật...
        </div>
      }>
        <LoginForm />
      </React.Suspense>
    </div>
  )
}
