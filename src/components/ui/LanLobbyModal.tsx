'use client';

import React, { useState } from 'react';
import { Wifi, RefreshCw, X } from 'lucide-react';

interface LanLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  status: 'DISCONNECTED' | 'WAITING' | 'CONNECTED';
  transport: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}

export const LanLobbyModal: React.FC<LanLobbyModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  status,
  transport,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [inputCode, setInputCode] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="max-w-lg w-full rounded-3xl bg-slate-950 border border-fuchsia-500/50 shadow-[0_0_50px_rgba(255,0,127,0.3)] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">CHƠI QUA MẠNG LAN / WI-FI</h3>
              <p className="text-xs text-slate-400">
                Kết nối P2P WebRTC giữa 2 thiết bị chung Wi-Fi hoặc 2 Tab trình duyệt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option A: Host Room */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
              1. Tạo Phòng (Chủ Phòng - Quân X)
            </span>
            <button
              onClick={onCreateRoom}
              className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tạo mã mới</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400">Mã Phòng LAN của bạn:</div>
              <div className="text-2xl font-mono font-black tracking-widest text-white">
                {roomCode || '----'}
              </div>
            </div>
            <button
              onClick={() => {
                if (roomCode) navigator.clipboard.writeText(roomCode);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold"
            >
              Copy Mã
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span>
              Trạng thái:{' '}
              <strong className={status === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-300'}>
                {status === 'CONNECTED'
                  ? `Đã kết nối (${transport}) - Sẵn sàng chiến!`
                  : 'Đang chờ người chơi thứ 2 nhập mã...'}
              </strong>
            </span>
          </div>
        </div>

        {/* Option B: Join Existing Room */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-fuchsia-500/30 space-y-3">
          <span className="text-xs font-black text-fuchsia-300 uppercase tracking-wider">
            2. Vào Phòng Của Bạn Bè (Khách - Quân O)
          </span>
          <div className="flex gap-2">
            <input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã phòng (VD: AB12-89)"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-sm text-white uppercase focus:outline-none focus:border-fuchsia-400"
            />
            <button
              onClick={() => onJoinRoom(inputCode)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white font-black text-xs shadow-[0_0_20px_rgba(255,0,127,0.4)]"
            >
              Kết Nối Ngay
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            💡 <strong>Mẹo test nhanh:</strong> Bạn có thể mở thêm 1 Tab trình duyệt nữa hoặc dùng máy thứ 2 cùng mạng Wi-Fi, nhập mã phòng ở trên để đánh đồng bộ thời gian thực!
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
          >
            Đóng & Vào Bàn Cờ
          </button>
        </div>
      </div>
    </div>
  );
};
