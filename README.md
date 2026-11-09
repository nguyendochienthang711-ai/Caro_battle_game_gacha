# CyberCaro 3D: Arena & Loot Gacha 🎮⚔️🎰

Dự án game cờ Caro 3D 30x30 cyberpunk tích hợp hệ thống RPG Meta-Game: Đánh Caro kiếm lượt quay, gacha vũ khí/giáp từ hạng C đến SS, xây dựng 6 ô trang bị tự do và bước vào Đấu Trường Battle (Vượt Ải Co-op cùng Đồng Đội & Solo 1vs1).

---

## 🌟 Tính Năng Nổi Bật

1. **Trang Chủ Dashboard Trung Tâm**:
   - Giao diện mở đầu thân thiện, tập trung quản lý nhân vật, chỉ số lực chiến, kho đồ và sảnh mời đồng đội.
   - Tặng sẵn 3 vé quay tân thủ khi bắt đầu.
   - Điều hướng mượt mà giữa Đấu Caro, Vòng Quay Gacha và Đấu Trường Battle.

2. **Đấu Trường Caro 3D 30x30**:
   - Đồ họa Three.js phong cách Neon Cyberpunk chân thực: camera xoay 3D / 2D đỉnh / điện ảnh 360°.
   - 3 chế độ chơi: Đấu với CyberBot AI, 1 máy 2 người, và kết nối mạng LAN / Wi-Fi (WebRTC P2P + BroadcastChannel).
   - Thưởng ngay **+1 Vé Quay** khi chiến thắng mỗi ván cờ.

3. **Vòng Quay Gacha Vũ Khí & Giáp (Hạng C ➔ SS)**:
   - **Hạng C & B**: Tăng chỉ số Công (ATK) hoặc Phòng Thủ (DEF/HP).
   - **Hạng A**: Mở khóa các dòng chỉ số cao cấp: Hút Máu %, Phản Đòn %, Bạo Kích & Sát Thương Bạo Kích %, Xuyên Giáp %.
   - **Hạng S**: Mở khóa Kỹ Năng Độc Nhất (Trảm Kích Không Gian, Huyết Tế Đoạt Mệnh, Khiên Phản Pháo).
   - **Hạng SS**: Mở khóa Tuyệt Kỹ Thần Thoại (Hố Đen Ngân Hà xuyên 100% giáp, Phán Quyết Tối Thượng, Thần Giáp Phượng Hoàng Niết Bàn hồi sinh 65% HP).
   - Cho phép người chơi tự do tùy chỉnh tỷ lệ rơi theo ý muốn.

4. **Hệ Thống 6 Ô Trang Bị Tự Do**:
   - Tự do kết hợp vũ khí và giáp: lắp 6 vũ khí (Full Công), 6 giáp (Full Thủ & Phản Đòn) hoặc cân bằng.
   - Nút tự động trang bị 6 món đồ mạnh nhất theo lực chiến.

5. **Đấu Trường Battle Bán Tự Động & Auto**:
   - **Vượt Ải Chiến Dịch (Co-op PvE)**: Sát cánh cùng đồng đội chinh phục 5 Ải Boss từ cấp độ sơ cấp đến Đại Đế Cyber Omega [SS] để nhận thêm lượt quay.
   - **Solo 1vs1 (PvP)**: Thách đấu trực tiếp với bạn bè qua mạng LAN hoặc các đấu thủ trong đấu trường.
   - Cơ chế chọn chiêu theo lượt hoặc bật Auto chiến đấu tự động.

6. **Sảnh Mời Đồng Đội & Kết Nối LAN**:
   - Tạo mã phòng, sao chép link mời nhanh (`?party=CODE`) gửi cho bạn bè để tự động ghép đội.
   - Sẵn sàng 3 đồng đội AI trợ chiến (Valkyrie Astra, Titan Reinhardt, Seraphina Nova).

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
- **3D Graphics**: Three.js
- **Audio**: Web Audio API Synthesizer (tự tạo âm thanh lập trình không cần file media ngoài)
- **Multiplayer / Networking**: WebRTC PeerJS, BroadcastChannel, Socket.IO
- **Icons**: Lucide React

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Chạy môi trường phát triển (Development)
npm run dev

# Mở trình duyệt tại: http://localhost:3000

# 3. (Tùy chọn) Chạy Server LAN nội bộ
npm run server
```
