# Calamity - Development Log & Context
*File này dùng để lưu trữ tiến độ phát triển của dự án Calamity. Khi bắt đầu một phiên làm việc mới (session mới), bạn chỉ cần mở file này lên hoặc bảo AI đọc file này để nắm bắt toàn bộ bối cảnh và tiếp tục công việc ngay lập tức.*

---

## 📅 Cập nhật gần nhất: Ngày 01/05/2026

### 1. Kiến trúc Game & Cơ sở dữ liệu (Phaser 3)
*   **Engine:** Phaser 3 (Web Game).
*   **Quy mô Bản đồ:** 3200 x 1800 pixels.
*   **Màn hình hiển thị (Camera):** 1280 x 720 (Đã tích hợp Camera Focus vào Player và Zoom x1.5).
*   **Asset:** 
    *   Nhân vật: Spritesheet chia theo 4 hàng tương ứng 4 hướng (Down, Left, Right, Up).
    *   Quái vật, Cây cối (nhiều biến thể), Đá (nhiều biến thể).

### 2. Các Tính Năng Đã Hoàn Thiện
*   **Hệ thống Di chuyển & Điều khiển (Movement & Controls):**
    *   Cơ chế **MOBA / ARPG Controls**: Click chuột phải để tự động tìm đường (Auto-pathing) đến điểm chỉ định.
    *   Click chuột trái vào quái vật để tự động khóa mục tiêu (Target - hiển thị khung đỏ) và chạy lại gần. Click ra đất trống sẽ hủy khóa mục tiêu.
    *   Hỗ trợ ghi đè (override) bằng phím cứng: WASD hoặc phím Mũi tên.
    *   Di chuyển chéo (Diagonal Movement) đã được chuẩn hóa tốc độ (Normalize velocity).
*   **Hệ thống Chiến đấu (Combat System):**
    *   Tự động khóa mục tiêu, chạy đến sát quái và chém liên hoàn. **Tự động quay mặt** về phía quái khi tấn công.
    *   Hỗ trợ **Hitbox chéo (Diagonal Hitbox)**: Đảm bảo đánh trúng quái kể cả khi quái đứng ở góc chéo.
    *   Nhấn Space để chém tại chỗ.
    *   Kỹ năng: Q (Lướt/Dash Slash - tốn 10 MP) và E (Xoay kiếm/Tornado - tốn 20 MP).
    *   Sát thương: Có floating text (số sát thương nảy lên màu đỏ) cho cả Player và Enemy.
*   **Hệ thống Giao diện UI (HUD):**
    *   HUD được thiết kế chuẩn Game RPG với Level Circle, HP (Đỏ), MP (Xanh), EXP (Vàng). Đã tích hợp thêm **số lượng Vàng (Gold)**.
    *   Giao diện hiển thị skill và thời gian hồi chiêu (Cooldown).
    *   **Fix lỗi kỹ thuật:** Tọa độ HUD đã được tối ưu hóa bằng công thức toán học để chống lại hiệu ứng Camera Zoom 1.5x của Phaser, đảm bảo luôn dính chặt ở góc trái trên cùng màn hình. Độ sâu (Depth) của HUD và Floating Text được set max là `9999` để không bao giờ bị cây/đá che khuất.
*   **Logic Sinh tồn & Tiến trình (Survival & Progression):**
    *   Player chết khi hết máu, hiển thị **Màn hình Game Over** với nút **🔄 Chơi Lại**.
    *   **Lưu cấp độ (Level Persistence):** Cấp độ và EXP được lưu vào `localStorage`, không bị mất khi F5 tải lại trang hay chơi lại.
    *   **Hệ thống Nâng cấp Ngoại hình (Skin Upgrade):** Tự động thay đổi bộ giáp khi đạt Level 5 (Swordsman_lvl2) và Level 10 (Swordsman_lvl3).
    *   Quái vật sau khi chết sẽ có thanh hồi sinh (Respawn) tự động xuất hiện lại tại vị trí cũ.
*   **Hệ thống Rơi đồ (Loot System):**
    *   Quái vật có 80% tỉ lệ rơi đồ khi chết: **Vàng** (10-25G, tỉ lệ cao), **Bình Máu** (+30 HP, tỉ lệ trung bình), **Bình Mana** (+20 MP, tỉ lệ thấp).
    *   Vật phẩm nảy lên đẹp mắt và biến mất sau 15 giây. Nhặt tự động khi đi ngang qua.
*   **Hệ thống Admin (Admin Panel - NEW):**
    *   Nhấn **F2** để bật/tắt bảng điều khiển Admin.
    *   Tính năng: Tăng/Giảm Level, Thêm 1000 Vàng, Hồi đầy HP/MP, Tiêu diệt toàn bộ quái vật trên bản đồ (Kill All).
    *   **Fix lỗi tương tác:** Đã tách riêng **UI Camera** để xử lý HUD và Admin Panel, khắc phục lỗi không bấm được nút do Camera chính bị Zoom 1.5x.
    *   **Fix lỗi đồ vật bị dính vào màn hình:** Cây cối, đá (Assets) đã được cấu hình lại để chỉ hiển thị trên Camera chính (trôi theo map) và bỏ qua ở UI Camera.
    *   Hỗ trợ test nhanh các mốc Level Skin (Lv 5, Lv 10) và cơ chế rơi đồ.

### 3. Vấn đề Đã Giải Quyết Trong Phiên Trước
*   Sửa lỗi mất hình khi nhân vật quay lưng (Idle Up) do spritesheet thiếu frame.
*   Sửa lỗi Player bị chết liên tục (Infinite Loop Game Over) ngay khi dính damage lúc hết máu.
*   Sửa lỗi hiệu ứng "cục tròn" (Target Marker) bị trượt vị trí khi thu nhỏ.
*   Sửa lỗi nhân vật bị kẹt (đơ) không thể di chuyển khi auto-attack quái do cơ chế ghi đè Animation.

---

## 🚀 Các Bước Tiếp Theo (Next Steps / To-Do)
*Dưới đây là một số gợi ý tính năng có thể làm tiếp trong tương lai:*
1.  **AI Quái Vật Thông Minh Hơn:** Quái vật hiện tại đứng yên cho đến khi bị đánh. Cần thêm logic tự động tuần tra (Patrol) hoặc rượt đuổi người chơi (Aggro) khi người chơi lại gần.
2.  **Hệ Thống Cửa Hàng (Shop):** Dùng Vàng nhặt được để mua đồ nâng cấp.
3.  **Hệ Thống Tìm Đường Nâng Cao (Pathfinding A*):** Khi click chuột phải sau một tảng đá, nhân vật hiện tại sẽ chạy kẹt vào tảng đá. Cần tích hợp thư viện tìm đường (như EasyStar.js) để né vật cản.
4.  **Âm Thanh (Audio):** Thêm tiếng chém kiếm, tiếng bước chân, hiệu ứng nhặt đồ, và nhạc nền.

---
*Lưu ý cho AI: Khi đọc được file này ở đầu phiên làm việc, hãy chào người dùng và đề xuất một trong các mục To-Do để tiếp tục làm việc!*
