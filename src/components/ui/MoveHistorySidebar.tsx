'use client';

import React, { useState } from 'react';
import {
  Zap,
  History,
  MessageSquare,
  Gamepad2,
  Trash2,
  Award,
  Play,
  Send,
  Undo2,
} from 'lucide-react';
import {
  MoveRecord,
  MatchHistoryItem,
  ChatMessage,
  ScoreboardData,
} from '../../types/game';

interface MoveHistorySidebarProps {
  moves: MoveRecord[];
  matchHistory: MatchHistoryItem[];
  chatMessages: ChatMessage[];
  activeTab: 'MOVES' | 'HISTORY' | 'CHAT';
  setActiveTab: (tab: 'MOVES' | 'HISTORY' | 'CHAT') => void;
  autoFocusMove: boolean;
  setAutoFocusMove: (val: boolean) => void;
  playerNames: { X: string; O: string };
  scoreboard: ScoreboardData;
  onResetScoreboard: () => void;
  onClearHistory: () => void;
  onStartReplay: (item: MatchHistoryItem) => void;
  onFocusCell: (row: number, col: number) => void;
  onSendChat: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
  onUndo?: () => void;
}

export const MoveHistorySidebar: React.FC<MoveHistorySidebarProps> = ({
  moves,
  matchHistory,
  chatMessages,
  activeTab,
  setActiveTab,
  autoFocusMove,
  setAutoFocusMove,
  playerNames,
  scoreboard,
  onResetScoreboard,
  onClearHistory,
  onStartReplay,
  onFocusCell,
  onSendChat,
  onSendEmoji,
  onUndo,
}) => {
  const [chatInput, setChatInput] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <aside className="w-80 xl:w-96 bg-slate-950/95 border-l border-slate-800/90 flex flex-col z-20 shrink-0 hidden md:flex">
      {/* Sidebar Navigation Tabs */}
      <div className="grid grid-cols-3 p-2 gap-1 bg-slate-900/70 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('MOVES')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'MOVES'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Nước Đi ({moves.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'HISTORY'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch Sử ({matchHistory.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'CHAT'
              ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat LAN</span>
        </button>
      </div>

      {/* TAB 1: MOVE LOG & COORDINATE TRACKER */}
      {activeTab === 'MOVES' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-400">NHẬT KÝ TỌA ĐỘ 30x30</span>
            <div className="flex items-center gap-2">
              {onUndo && (
                <button
                  onClick={onUndo}
                  disabled={moves.length === 0}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-35 border border-slate-700 text-[11px] font-bold text-cyan-300 transition"
                  title="Đi lại nước cờ gần nhất"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Đi Lại</span>
                </button>
              )}
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFocusMove}
                  onChange={(e) => setAutoFocusMove(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
                <span>Tự khóa camera</span>
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {moves.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
                <Gamepad2 className="w-8 h-8 mb-2 text-slate-700" />
                <p>Chưa có nước cờ nào được đặt.</p>
                <p className="text-[11px] mt-1">Nhấn trực tiếp lên mặt bàn 3D 30x30 để khai cuộc!</p>
              </div>
            ) : (
              [...moves].reverse().map((m, idx) => {
                const isLatest = idx === 0;
                return (
                  <div
                    key={m.step}
                    onClick={() => onFocusCell(m.row, m.col)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition ${
                      isLatest
                        ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-mono text-slate-500 w-7">#{m.step}</span>
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          m.player === 'X'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                            : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40'
                        }`}
                      >
                        {m.player}
                      </span>
                      <span className="text-xs font-semibold">
                        {m.player === 'X' ? playerNames.X : playerNames.O}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                        {m.coord}
                      </span>
                      {isLatest && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Persistent LocalStorage Stats Summary Footer */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Chuỗi thắng:{' '}
              <span className="text-amber-300 font-bold">
                {scoreboard.streakCount > 0
                  ? `${scoreboard.streakPlayer} (${scoreboard.streakCount} trận)`
                  : '0'}
              </span>
            </div>
            <button
              onClick={onResetScoreboard}
              className="text-[11px] text-rose-400 hover:underline"
            >
              Reset tỷ số
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: LOCALSTORAGE MATCH HISTORY & 3D REPLAY */}
      {activeTab === 'HISTORY' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-400">LỊCH SỬ ĐẤU (LOCAL STORAGE)</span>
            {matchHistory.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:underline"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa hết</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {matchHistory.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs px-4">
                <Award className="w-8 h-8 mb-2 text-slate-700" />
                <p>Chưa có trận đấu nào hoàn thành.</p>
                <p className="text-[11px] mt-1">
                  Mọi trận đấu kết thúc sẽ tự động lưu tại đây để bạn Xem lại 3D!
                </p>
              </div>
            ) : (
              matchHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
                        item.winner === 'X'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : item.winner === 'O'
                          ? 'bg-fuchsia-500/20 text-fuchsia-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.winner === 'DRAW' ? 'HÒA CỜ' : `THẮNG: QUÂN ${item.winner}`}
                    </span>
                    <span className="text-[11px] text-slate-500">{item.date}</span>
                  </div>

                  <div className="text-xs text-slate-300 font-semibold truncate">
                    {item.playerXName} <span className="text-slate-500">vs</span> {item.playerOName}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {item.winningDirection} • {item.totalMoves} nước
                    </span>
                    <button
                      onClick={() => onStartReplay(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-bold"
                    >
                      <Play className="w-3 h-3" />
                      <span>Replay 3D</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LAN CHAT & QUICK EMOJI REACTIONS */}
      {activeTab === 'CHAT' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          {/* Quick Emoji Bar */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-xl bg-slate-900 border border-slate-800">
            {['🔥', '😎', '⚡', '👏', '😱', '🏆'].map((emo) => (
              <button
                key={emo}
                onClick={() => onSendEmoji(emo)}
                className="text-lg hover:scale-125 transition transform"
                title="Thả biểu cảm nhanh"
              >
                {emo}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold mb-0.5">
                  <span>{msg.sender}</span>
                  <span className="text-slate-500">{msg.time}</span>
                </div>
                <p className="text-slate-200 break-words">{msg.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleFormSubmit} className="flex gap-1.5">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhập tin nhắn phòng LAN..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};
