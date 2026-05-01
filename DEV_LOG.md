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
    *   **Ma thuật (NEW):** Hệ thống ma thuật Lửa (Fire) và Nước (Water) với đầy đủ Arrow, Ball và Spell.
    *   **Khói (NEW):** Đã tích hợp trọn bộ Asset Smoke cực khủng (Smoke Blow, Explosion, Spell, Chemical, Poisonous) cho Sát Thủ Khói.

### 2. Các Tính Năng Đã Hoàn Thiện
*   **Hệ thống Class Đa dạng (Multiclass System - NEW):**
    *   **Chiến Binh (Warrior):** Sử dụng kiếm, có hệ thống độ hiếm vũ khí.
    *   **Pháp Sư Nguyên Tố (Elemental Mage):** Kết hợp Lửa và Nước. Đánh thường bắn cầu ma thuật luân phiên. Skill Q bắn Water Arrow (xuyên thấu), Skill E gọi Fire Spell (AOE nổ tại vị trí chuột).
    *   **Sát Thủ Khói (Smoke Assassin):** Sử dụng ám khí khói. Skill Q ném phi tiêu khói, Skill E Độn Thổ (Blink) để lại làn khói gây sát thương khi hạ cánh.
    *   **Giao diện Chọn Class:** Menu overlay lúc khởi đầu và nút **"Đổi Class / Vũ Khí"** ngay trong game để chuyển đổi linh hoạt.
*   **Hệ thống Vũ Khí (Weapon Rarity - NEW):**
    *   Cung cấp 3 cấp độ vũ khí cho Chiến Binh: **Common (Trắng), Uncommon (Xanh), Rare (Đỏ)**.
    *   Mỗi cấp độ tăng thêm chỉ số Sát thương (Damage) tương ứng (+0, +15, +35).
    *   Hiển thị icon vũ khí hiện tại và chỉ số bonus ngay trên HUD.
*   **Hệ thống Bản đồ & Di chuyển:**
    *   **Village Map Refactoring:** Thu nhỏ tỉ lệ các công trình (0.3 - 0.4) để cân đối với nhân vật.
    *   **Dungeon Gate:** Di dời cổng dịch chuyển sang phía Đông, nằm giữa 2 pháo đài canh gác để tăng tính thẩm mỹ.
    *   **Kéo để di chuyển (Drag to move - NEW):** Giữ chuột phải và kéo để nhân vật liên tục chạy theo con trỏ chuột.
    *   Cơ chế **MOBA / ARPG Controls**: Click chuột phải để di chuyển, click chuột trái khóa mục tiêu.
*   **Hệ thống Chiến đấu (Combat System):**
    *   **Projectile System:** Pháp sư và Sát thủ sử dụng hệ thống bắn đạn đạo thay vì áp sát. Đã trả lại **Khung đỏ Targeting** khi click chuột trái vào quái để dễ ngắm bắn.
    *   Các kỹ năng đạn đạo (Projectile) đã được lập trình **quay đầu nhọn** (Rotation + Math.PI) về phía mục tiêu.
    *   Tự động quay mặt về phía con trỏ chuột khi dùng chiêu hoặc tấn công.
    *   Kỹ năng Warrior: Q (Lướt/Dash Slash) và E (Xoay kiếm/Tornado).
*   **Hệ thống Giao diện UI (HUD):**
    *   HUD hiển thị Level, HP, MP, EXP, Gold và Skill Slot với Cooldown.
    *   Đã fix lỗi HUD bị trượt khi Zoom camera.
*   **Hệ thống Admin (Admin Panel):**
    *   Nhấn **F2** để bật/tắt: Tăng Level, Vàng, Hồi máu, Kill All quái vật.

### 3. Vấn đề Đã Giải Quyết Trong Phiên Trước
*   **Fix lỗi "Đơ" nhân vật (Root Cause):** Sửa lỗi kẹt vĩnh viễn ở trạng thái `isAttacking` do event `animationcomplete` bị ghi đè. Thay bằng timer `delayedCall` kết hợp hệ thống auto-reset an toàn sau 800ms.
*   **Fix lỗi undefined `projectilesGroup`:** Chỉnh lại thứ tự khởi tạo (Initialization Order) giữa Player và Scene, tránh crash khi gọi đạn.
*   **Fix hướng nhìn:** Nhân vật giờ đây quay mặt chính xác về phía trỏ chuột khi dùng phép.
*   **Fix hiển thị Skill:** Chỉnh lại kích thước (Scale) các quả cầu ma thuật (0.15) và ám khí khói (0.12) cho phù hợp với đầu nhân vật, nổ phép Lửa (E) xuất hiện theo hướng nhìn thay vì ở con trỏ chuột.
*   **Nâng cấp Asset Khói:** Áp dụng bộ hiệu ứng khói động đa dạng cho các chiêu của Sát Thủ thay vì 1 ảnh tĩnh.

---

## 🚀 Các Bước Tiếp Theo (Next Steps / To-Do)
1.  **Hệ Thống Nhiệm Vụ (Quest):** Thêm NPC giao nhiệm vụ diệt quái.
2.  **AI Quái Vật Nâng Cao:** Quái vật tự động đi tuần hoặc đuổi theo người chơi khi vào tầm nhìn.
3.  **Hệ Thống Cửa Hàng (Shop):** Dùng Vàng mua thêm các loại ma thuật hoặc vũ khí hiếm.
4.  **Âm Thanh (Audio):** Thêm tiếng phép thuật, tiếng chém kiếm và nhạc nền map.

---
*Lưu ý cho AI: Khi đọc được file này ở đầu phiên làm việc, hãy chào người dùng và đề xuất một trong các mục To-Do để tiếp tục làm việc!*
