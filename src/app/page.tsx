import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { ShieldCheck, Calendar, HelpCircle, Phone, MapPin, Award } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

export const dynamic = "force-dynamic";

async function getPitches() {
  try {
    const { data } = await supabaseAdmin
      .from('pitches')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('name', { ascending: true });
    return data || [];
  } catch (e) {
    return [];
  }
}

export default async function LandingPage() {
  const pitches = await getPitches();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              ⚽
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
              PITCH MANAGER
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Giới thiệu</a>
            <a href="#pitches" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Danh sách sân</a>
            <a href="#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Bảng giá</a>
            <a href="#contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Liên hệ</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link 
              href="/login"
              className="text-sm font-medium text-zinc-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400 px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md shadow-sm transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent dark:from-emerald-950/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Award className="h-3.5 w-3.5" /> Hệ thống quản lý sân cỏ nhân tạo hàng đầu
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Đặt Sân Bóng Mini <br />
                <span className="text-emerald-600 dark:text-emerald-400">Nhanh Chóng & Tiện Lợi</span>
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto lg:mx-0">
                Tìm kiếm khung giờ trống, lựa chọn sân bóng mini 5, 7 hoặc 11 người. Đặt sân trực tuyến, thanh toán linh hoạt và check-in bằng mã QR chỉ trong vài giây.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all text-center"
                >
                  Đặt sân ngay hôm nay
                </Link>
                <a
                  href="#pitches"
                  className="w-full sm:w-auto px-8 py-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium rounded-lg transition-colors text-center"
                >
                  Xem danh sách sân
                </a>
              </div>
            </div>
            
            {/* Visual element */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[420px] aspect-square rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 p-8 flex flex-col justify-between shadow-2xl text-white overflow-hidden group">
                {/* Decorative ball pattern */}
                <div className="absolute -right-20 -bottom-20 text-[260px] opacity-10 select-none pointer-events-none transition-transform group-hover:rotate-45 duration-1000">⚽</div>
                
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-widest text-emerald-100 font-semibold">Live Status</span>
                    <h3 className="font-extrabold text-2xl">Sân cỏ Standard</h3>
                  </div>
                  <span className="bg-white/20 backdrop-blur-md text-xs font-semibold px-2.5 py-1 rounded-full">5-a-side</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="opacity-80">Giá thuê:</span>
                      <span className="font-bold text-base text-yellow-300">200.000đ / giờ</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex items-center gap-2 text-xs text-emerald-100">
                      <div className="h-2 w-2 rounded-full bg-green-300 animate-ping" />
                      <span>Đèn cao áp & nước uống miễn phí</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-emerald-200">
                    <ShieldCheck className="h-4 w-4 text-green-300 shrink-0" />
                    <span>Hệ thống thoát nước thông minh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Icons Section */}
      <section id="about" className="py-16 border-t border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 p-6 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-900">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Đặt lịch tức thì</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Chọn sân bóng, khung giờ rảnh và hoàn tất đặt lịch chỉ sau 3 bước đơn giản.</p>
              </div>
            </div>
            
            <div className="flex gap-4 p-6 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-900">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">QR Code Check-in</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Không cần thủ tục giấy tờ rắc rối. Nhận mã QR qua email và quét tại quầy để vào sân.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-900">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Hỗ trợ 24/7</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Bộ phận quản lý sân luôn trực tuyến hỗ trợ bạn ghép đội, đặt nước uống, dụng cụ thi đấu.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pitch List Section */}
      <section id="pitches" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Danh Sách Sân Bóng</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Sân của chúng tôi được phủ cỏ chất lượng tốt nhất, hệ thống chiếu sáng chuẩn và luôn được dọn dẹp sạch sẽ trước mỗi trận đấu.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pitches.length > 0 ? (
              pitches.map((pitch) => (
                <div key={pitch.id} className="group flex flex-col bg-white dark:bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                  {/* Decorative Banner */}
                  <div className="h-32 bg-gradient-to-r from-emerald-800 to-emerald-600 flex items-center justify-between p-6 text-white relative">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
                        {pitch.type === "MINI_5" ? "Sân 5 người" : pitch.type === "MINI_7" ? "Sân 7 người" : "Sân 11 người"}
                      </span>
                      <h3 className="font-bold text-lg line-clamp-1">{pitch.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs opacity-80 block">Giá thuê</span>
                      <span className="font-extrabold text-lg text-yellow-300">{Number(pitch.price_per_hour).toLocaleString('vi-VN')}đ<span className="text-xs font-normal text-white">/h</span></span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3">
                      {pitch.description || "Chưa có mô tả chi tiết cho sân bóng này. Vui lòng liên hệ quản lý sân để biết thêm chi tiết."}
                    </p>

                    <div className="space-y-4">
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>Trạng thái:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Đang hoạt động</span>
                      </div>
                      <Link
                        href="/login"
                        className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-medium rounded-lg text-sm transition-colors shadow-sm"
                      >
                        Đặt sân ngay
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-950/20">
                ⚽ Hiện tại tất cả các sân đều đang kín lịch hoặc bảo trì. Vui lòng liên hệ Hotline để biết thông tin chi tiết.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing / Promotions Section */}
      <section id="pricing" className="py-20 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Bảng Giá Dịch Vụ & Ưu Đãi</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Khung giờ vàng đi kèm các chương trình khuyến mại nước uống và giảm giá thuê sân định kỳ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-950 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">Khung giờ Sáng</span>
                <h3 className="text-xl font-bold">Từ 05:00 - 15:00</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Thích hợp cho các trận đấu giao lưu nội bộ, tập thể dục buổi sáng hoặc chiều sớm.</p>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  Giảm 20% <span className="text-xs font-normal text-zinc-500">giá sân gốc</span>
                </div>
              </div>
              <ul className="text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>✓ Miễn phí 1 thùng nước đá</li>
                <li>✓ Miễn phí mượn áo pitch</li>
                <li>✓ Có phòng tắm nước nóng</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-xl p-8 border-2 border-emerald-600 dark:border-emerald-500 space-y-6 flex flex-col justify-between relative shadow-md">
              <span className="absolute top-0 right-6 transform -translate-y-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Phổ biến</span>
              <div className="space-y-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">Giờ Vàng Cao Điểm</span>
                <h3 className="text-xl font-bold">Từ 16:00 - 22:00</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Khung giờ được yêu thích nhất dành cho các giải đấu phong trào và giới văn phòng sau giờ làm.</p>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  Giá Tiêu Chuẩn
                </div>
              </div>
              <ul className="text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>✓ Hệ thống đèn LED cao áp chuẩn</li>
                <li>✓ Miễn phí 1 thùng nước đá</li>
                <li>✓ Cho thuê giày đá bóng giá rẻ</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">Hợp đồng tháng</span>
                <h3 className="text-xl font-bold">Cố định đội bóng</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Dành cho các câu lạc bộ hoạt động sinh hoạt đều đặn hàng tuần cố định khung giờ dài hạn.</p>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  Giảm 10% / Tháng
                </div>
              </div>
              <ul className="text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>✓ Cố định lịch đá hàng tuần</li>
                <li>✓ Ưu tiên chọn sân đẹp</li>
                <li>✓ Thanh toán cuối tháng linh hoạt</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl font-sans">Liên Hệ Đặt Sân Trực Tiếp</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Nếu bạn gặp khó khăn khi đặt lịch online, hãy liên hệ trực tiếp số điện thoại hỗ trợ của quản lý sân.</p>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Số điện thoại Hotline</span>
                  <span className="font-extrabold text-lg">090 123 4567 (Zalo)</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block">Địa chỉ tổ hợp sân</span>
                  <span className="font-bold text-sm">Đường Số 10, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <h3 className="font-bold text-lg">Giờ mở cửa hoạt động</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Hệ thống sân bóng mở cửa liên tục tất cả các ngày trong tuần bao gồm cả các ngày lễ.</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Thứ 2 - Chủ Nhật:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">05:00 AM - 11:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="container mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} Pitch Manager System. Được thiết kế chuyên nghiệp bởi Antigravity.</p>
          <p className="opacity-75">Next.js 15 • Tailwind CSS v4 • PostgreSQL • Prisma ORM</p>
        </div>
      </footer>
    </div>
  );
}
