"use client"

import * as React from "react"
import { ToastProvider } from "@/components/ui/toast-simple"

export function Providers({ children }: { children: React.ReactNode }) {
  // Kích hoạt chế độ Dark Mode mặc định để tạo giao diện lung linh, sang trọng
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
