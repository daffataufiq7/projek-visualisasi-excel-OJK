import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Info, ChevronRight, CheckCircle2, User } from 'lucide-react';
import Logo from './Logo';

interface LoginPageProps {
  onLogin: (nipOrEmail: string, password: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [nipOrEmail, setNipOrEmail] = useState('daffataufiq@ojk.go.id');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nipOrEmail.trim()) {
      setError('Harap masukkan NIP atau Email Anda');
      return;
    }
    if (!password) {
      setError('Harap masukkan Password Anda');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(nipOrEmail, password);
      setIsSubmitting(false);
    }, 600);
  };

  const handleQuickAdminLogin = () => {
    setNipOrEmail('daffataufiq@ojk.go.id');
    setPassword('admin123');
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin('daffataufiq@ojk.go.id', 'admin123');
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow & Ambient Lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#C61E1E]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-[500px] h-[500px] bg-[#C61E1E]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">

        {/* LEFT SIDE: HERO BANNER & BUILDING MOCKUP */}
        <div className="lg:col-span-6 relative bg-gradient-to-br from-slate-900 via-slate-950 to-[#500a0a] p-8 lg:p-12 flex flex-col justify-between overflow-hidden min-h-[400px] lg:min-h-[640px]">
          {/* Subtle Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* OJK Architectural Graphic Backdrop */}
          <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop')`
          }} />

          {/* Gradient Darkness Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

          {/* Top Logo / Brand Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl flex items-center gap-3">
              <Logo />
              <div className="h-4 w-[1px] bg-white/20" />
              <span className="text-xs font-bold tracking-widest text-slate-200 uppercase">JAWA BARAT</span>
            </div>
          </div>

          {/* Main Hero Headline */}
          <div className="relative z-10 space-y-4 my-auto py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                Financial <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-white">
                  Visualization
                </span> <br />
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed font-medium max-w-md">
                Visualisasi otomatis data keuangan dari file Excel untuk analisis kinerja dan rasio perbankan regional Jawa Barat.
              </p>
            </motion.div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3 max-w-sm">
              <div className="w-9 h-9 rounded-xl bg-[#C61E1E]/20 border border-[#C61E1E]/40 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-red-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Sistem Internal OJK</h4>
                <p className="text-[11px] text-slate-400">Akses terbatas untuk pegawai berwenang</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM CARD & ABOUT US */}
        <div className="lg:col-span-6 bg-slate-50 p-6 sm:p-8 lg:p-12 flex flex-col justify-between space-y-8">

          {/* LOGIN FORM CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden">
            {/* Red Accent Top Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C61E1E] via-red-500 to-[#C61E1E]" />

            {/* OJK Logo Header */}
            <div className="text-center space-y-2 pt-2">
              <div className="flex justify-center mb-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm inline-flex items-center gap-2">
                  <Logo />
                </div>
              </div>
              <p className="text-[11px] font-black text-[#C61E1E] uppercase tracking-widest">OTORITAS JASA KEUANGAN JAWA BARAT</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang Kembali!</h2>
              <p className="text-xs text-slate-500 font-medium">
                Masuk untuk mengakses dashboard visualisasi data keuangan
              </p>
            </div>

            {/* Quick Login Admin Info Pill */}
            <div className="bg-red-50/80 border border-red-100 p-3 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#C61E1E] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
                  DT
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 truncate">Daffa Taufiq</span>
                    <span className="bg-[#C61E1E] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Admin OJK</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate">daffataufiq@ojk.go.id</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="bg-[#C61E1E] hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>Masuk Admin</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NIP / Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>NIP / Email</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={nipOrEmail}
                    onChange={(e) => setNipOrEmail(e.target.value)}
                    placeholder="Masukkan NIP atau Email Anda"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#C61E1E] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-4 py-3 text-xs font-medium focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Password</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#C61E1E] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-11 py-3 text-xs font-medium focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Checkbox & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#C61E1E] focus:ring-red-500 accent-[#C61E1E] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">Ingat saya</span>
                </label>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert('Silakan hubungi Administrator IT OJK Jawa Barat untuk me-reset password Anda.'); }}
                  className="text-xs font-bold text-[#C61E1E] hover:underline"
                >
                  Lupa password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C61E1E] hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 hover:shadow-red-600/40 transition-all duration-200 cursor-pointer disabled:opacity-75 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ABOUT US / TENTANG APLIKASI SECTION */}
          <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <div className="p-1.5 bg-red-50 border border-red-100 rounded-xl text-[#C61E1E]">
                <Info size={16} />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Tentang Aplikasi (About Us)</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              <strong>FINSIGHT OJK Jawa Barat</strong> adalah platform sistem visualisasi keuangan internal yang dirancang untuk mempercepat pengolahan dan analisis data perbankan regional (Aset, DPK, Kredit per Jenis, NPL, dan CAR) dari berkas Excel secara otomatis, presisi, dan terintegrasi.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <CheckCircle2 size={13} className="text-[#C61E1E]" />
                <span>Parser Excel Otomatis</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <CheckCircle2 size={13} className="text-[#C61E1E]" />
                <span>Analisis Rasio & YoY</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[11px] text-slate-400 font-medium pt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>Internal Staff Only — Protected by OJK Security</span>
          </div>

        </div>

      </div>
    </div>
  );
}
