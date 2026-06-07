"use client"

import * as React from "react"
import { useToast } from "@/components/ui/toast-simple"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit2, Trash2, ShieldAlert, RefreshCw, Eye } from "lucide-react"

interface Pitch {
  id: string;
  name: string;
  type: 'MINI_5' | 'MINI_7' | 'STANDARD_11';
  pricePerHour: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  description: string;
}

export default function AdminPitchesPage() {
  const { toast } = useToast()
  
  const [pitches, setPitches] = React.useState<Pitch[]>([])
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  // Dialog states
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingPitch, setEditingPitch] = React.useState<Pitch | null>(null)

  // Form states
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<'MINI_5' | 'MINI_7' | 'STANDARD_11'>("MINI_5")
  const [pricePerHour, setPricePerHour] = React.useState("")
  const [status, setStatus] = React.useState<'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>("ACTIVE")
  const [description, setDescription] = React.useState("")

  const loadPitches = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pitches")
      if (res.ok) {
        const data = await res.json()
        setPitches(data.pitches)
      } else {
        toast({ title: "Lỗi tải sân bóng", description: "Không thể lấy danh sách sân bóng.", type: "error" })
      }
    } catch (e) {
      toast({ description: "Lỗi kết nối máy chủ.", type: "error" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadPitches()
  }, [loadPitches])

  const openAddDialog = () => {
    setEditingPitch(null)
    setName("")
    setType("MINI_5")
    setPricePerHour("200000")
    setStatus("ACTIVE")
    setDescription("")
    setIsOpen(true)
  }

  const openEditDialog = (pitch: Pitch) => {
    setEditingPitch(pitch)
    setName(pitch.name)
    setType(pitch.type)
    setPricePerHour(Number(pitch.pricePerHour).toString())
    setStatus(pitch.status)
    setDescription(pitch.description || "")
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !pricePerHour) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên sân và giá thuê.", type: "warning" })
      return
    }

    setSubmitting(true)
    try {
      const url = editingPitch ? `/api/pitches/${editingPitch.id}` : "/api/pitches"
      const method = editingPitch ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          pricePerHour: parseFloat(pricePerHour),
          status,
          description,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Lỗi xử lý",
          description: data.error || "Không thể thực hiện yêu cầu.",
          type: "error"
        })
      } else {
        toast({
          title: editingPitch ? "Đã cập nhật sân" : "Đã thêm sân mới",
          description: data.message,
          type: "success"
        })
        setIsOpen(false)
        loadPitches()
      }
    } catch (error) {
      toast({ description: "Có lỗi xảy ra khi gọi API.", type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sân bóng này? Dữ liệu đặt sân liên quan sẽ bị xóa!")) return

    try {
      const res = await fetch(`/api/pitches/${id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: "Lỗi xóa sân", description: data.error || "Không thể xóa sân.", type: "error" })
      } else {
        toast({ title: "Xóa thành công", description: "Sân bóng đã được xóa khỏi hệ thống.", type: "success" })
        loadPitches()
      }
    } catch (e) {
      toast({ description: "Lỗi kết nối mạng.", type: "error" })
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Đang hoạt động";
      case "MAINTENANCE": return "Đang bảo trì";
      case "INACTIVE": return "Ngừng hoạt động";
      default: return status;
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20";
      case "MAINTENANCE": return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20";
      case "INACTIVE": return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-500/20";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Sân Bóng</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Thêm sân bóng, thay đổi giá dịch vụ và trạng thái sân</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadPitches}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            onClick={openAddDialog}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" /> Thêm sân mới
          </Button>
        </div>
      </div>

      {/* Pitches Table Card */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          {!loading || pitches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Tên sân bóng</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Loại sân</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Bảng giá gốc</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Trạng thái</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-zinc-500 dark:text-zinc-400">Mô tả chi tiết</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-zinc-500 dark:text-zinc-400">Hành động</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pitches.map((pitch) => (
                  <TableRow key={pitch.id}>
                    <TableCell className="font-bold">{pitch.name}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs py-1 px-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {pitch.type === "MINI_5" ? "Sân 5 người" : pitch.type === "MINI_7" ? "Sân 7 người" : "Sân 11 người"}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                      {Number(pitch.pricePerHour).toLocaleString('vi-VN')}đ / h
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(pitch.status)}`}>
                        {getStatusLabel(pitch.status)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {pitch.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditDialog(pitch)}
                          className="h-8 px-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                        >
                          <Edit2 className="h-4 w-4" /> Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pitch.id)}
                          className="h-8 px-2 border-red-200 dark:border-red-950 text-red-500 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" /> Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center text-zinc-500">
              Đang tải danh sách sân bóng hoặc chưa có sân bóng nào...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent onClose={() => setIsOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingPitch ? "Chỉnh Sửa Sân Bóng" : "Thêm Sân Bóng Mới"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Điền các thông tin chi tiết của sân bóng vào form bên dưới.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            
            {/* Tên sân */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tên sân bóng *</label>
              <Input
                placeholder="Ví dụ: Sân cỏ mini A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Loại sân & Trạng thái */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Loại sân *</label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  disabled={submitting}
                >
                  <option value="MINI_5">Sân 5 người</option>
                  <option value="MINI_7">Sân 7 người</option>
                  <option value="STANDARD_11">Sân 11 người</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Trạng thái sân *</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  disabled={submitting}
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                  <option value="INACTIVE">Ngừng nhận sân</option>
                </Select>
              </div>
            </div>

            {/* Giá tiền */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Giá thuê (VND / giờ) *</label>
              <Input
                type="number"
                placeholder="200000"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Mô tả chi tiết</label>
              <Input
                placeholder="Ví dụ: Cỏ mới, hệ thống thoát nước tốt..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
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
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
