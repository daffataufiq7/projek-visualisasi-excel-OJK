import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Trash2, Shield, User, Mail, Lock, Building, X, CheckCircle, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types/dashboard';

interface UserManagementProps {
  usersList: UserProfile[];
  onAddUser: (newUser: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  currentAdminEmail?: string;
}

export default function UserManagement({
  usersList,
  onAddUser,
  onDeleteUser,
  currentAdminEmail = 'daffataufiq@ojk.go.id'
}: UserManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Analis Perbankan OJK');
  const [agency, setAgency] = useState('OJK Jawa Barat');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Harap masukkan nama lengkap pengguna');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Harap masukkan alamat email / NIP yang valid (contoh: user@ojk.go.id)');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password minimal 4 karakter');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const initials = name
      .trim()
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newUser: UserProfile = {
      id: cleanEmail,
      name: name.trim(),
      email: cleanEmail,
      role: role.trim() || 'Analis Perbankan OJK',
      avatarInitials: initials || 'OJ',
      agency: agency.trim() || 'OJK Jawa Barat',
      password: password,
      createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    onAddUser(newUser);

    setSuccessMsg(`Pengguna "${newUser.name}" berhasil ditambahkan!`);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Analis Perbankan OJK');
    setAgency('OJK Jawa Barat');
    setIsModalOpen(false);

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleDelete = (user: UserProfile) => {
    if (user.email.toLowerCase() === currentAdminEmail.toLowerCase() || user.id.toLowerCase() === 'daffataufiq@ojk.go.id') {
      alert('Akun Utama Admin Daffa Taufiq tidak dapat dihapus');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun "${user.name}" (${user.email})?`)) {
      onDeleteUser(user.id);
      setSuccessMsg(`Akun "${user.name}" telah berhasil dihapus dari sistem.`);
      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C61E1E]/10 text-[#C61E1E] flex items-center justify-center font-bold">
              <Shield size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Manajemen Pengguna (User Management)</h2>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#C61E1E] text-white px-2 py-0.5 rounded-full">
              Khusus Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium pl-10">
            Kelola daftar akun pegawai OJK yang dapat melakukan login, upload file Excel, dan melihat visualisasi data
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setError(null); setIsModalOpen(true); }}
          className="bg-[#C61E1E] hover:bg-red-700 active:bg-red-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <UserPlus size={15} />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* NOTIFICATION MESSAGES */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* USER LIST TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Pengguna</th>
              <th className="py-3 px-4">Role / Jabatan</th>
              <th className="py-3 px-4">Instansi / Kampus</th>
              <th className="py-3 px-4">Status Akun</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium">
            {usersList.map((user) => {
              const isAdmin = user.email.toLowerCase() === 'daffataufiq@ojk.go.id';
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* User Profile Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                        isAdmin ? 'bg-[#C61E1E]' : 'bg-slate-700'
                      }`}>
                        {user.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs truncate">{user.name}</span>
                          {isAdmin && (
                            <span className="text-[9px] font-black bg-red-100 text-[#C61E1E] px-1.5 py-0.5 rounded uppercase">
                              Admin Utama
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 font-bold text-[11px] px-2.5 py-1 rounded-lg">
                      {user.role}
                    </span>
                  </td>

                  {/* Agency */}
                  <td className="py-3.5 px-4 text-slate-600 font-semibold">
                    {user.agency}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Aktif
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      disabled={isAdmin}
                      className={`p-2 border rounded-xl transition-all font-bold text-[11px] inline-flex items-center gap-1 ${
                        isAdmin 
                          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-[#C61E1E] hover:border-red-200 cursor-pointer'
                      }`}
                      title={isAdmin ? "Akun Admin Utama tidak dapat dihapus" : "Hapus Akun Pengguna"}
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH PENGGUNA BARU */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-[#C61E1E]" />
                  <h3 className="text-sm font-bold text-slate-800">Tambah Pengguna Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error inside modal */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Input Fields */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                  <div className="relative flex items-center">
                    <User size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">NIP / Email Login</label>
                  <div className="relative flex items-center">
                    <Mail size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Contoh: budisantoso@ojk.go.id"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                  <div className="relative flex items-center">
                    <Lock size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password akun baru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Role / Jabatan</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Analis Perbankan OJK"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Instansi / Kampus</label>
                    <input
                      type="text"
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      placeholder="OJK Jawa Barat"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C61E1E]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#C61E1E] hover:bg-red-700 text-xs font-bold text-white shadow-sm cursor-pointer"
                  >
                    Simpan Pengguna
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
