cybercaro-3d-nextjs/
├── package.json
├── next.config.mjs
├── server.js                      # Custom Node.js + Socket.IO LAN Server (Tùy chọn)
└── src/
    ├── app/
    │   ├── layout.tsx             # Root Layout + Font Orbitron / Inter
    │   ├── page.tsx               # Điều phối Dashboard, Caro 3D, Vòng Quay & Đấu Trường Battle
    │   └── globals.css            # TailwindCSS + Neon Glassmorphism styles
    ├── types/
    │   └── game.ts                # Kiểu dữ liệu Bàn cờ 30x30, Trang bị C->SS, 6 Ô Build, Battle
    ├── lib/
    │   ├── gomokuEngine.ts        # Thuật toán kiểm tra thắng 5 ô & AI CyberBot
    │   ├── rpgEngine.ts           # Kho Vũ khí/Giáp (C->SS), Kỹ năng độc nhất S/SS, Ải & Đối thủ
    │   ├── soundEngine.ts         # Bộ tổng hợp âm thanh Web Audio API (Caro + Gacha + Battle)
    │   └── storage.ts             # Quản lý LocalStorage (Hồ sơ RPG, Ván cờ, Lịch sử)
    ├── hooks/
    │   ├── useGameEngine.ts       # Quản lý State ván cờ, Undo, Đồng hồ đếm ngược, Thưởng Vé Quay
    │   └── useLanMultiplayer.ts   # Kết nối Tổ Đội LAN/Wi-Fi (WebRTC PeerJS + BroadcastChannel)
    └── components/
        ├── 3d/
        │   ├── CaroScene3D.tsx    # Khung cảnh Three.js, Camera Orbit, Raycaster
        │   ├── Piece3D.ts         # Tạo Mesh 3D Quân X (Tinh thể Cyan) & O (Vòng Neon)
        │   └── EffectsManager.ts  # Hiệu ứng Sóng xung kích, Hạt nổ, Tia Laser thắng
        └── ui/
            ├── CyberDashboard.tsx # Trang chủ Dashboard, 6 Ô Trang bị tự do, Sảnh Mời Đồng Đội
            ├── GachaModal.tsx     # Vòng quay Vũ khí/Giáp (C -> SS) & Bảng tùy chỉnh tỷ lệ rơi
            ├── BattleArenaModal.tsx # Đấu trường Vượt Ải cùng Đồng đội & Solo 1vs1 (Bán tự động/Auto)
            ├── TopNavbar.tsx      # Thanh điều hướng, Chế độ chơi, Camera Presets, Nút về Dashboard
            ├── PlayerScoreCard.tsx# Bảng tỷ số 2 người chơi + Thưởng Lượt Quay khi thắng Caro
            ├── LanLobbyModal.tsx  # Phòng chờ mạng LAN / Wi-Fi (Tạo mã & Vào phòng)
            └── MoveHistorySidebar.tsx # Nhật ký tọa độ (A1..AD30) & Lịch sử đấu
