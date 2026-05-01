export default class AdminPanel {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        // Tạo DOM element cho Admin Panel (không bị ảnh hưởng bởi camera zoom)
        const div = document.createElement('div');
        div.id = 'admin-panel';
        div.innerHTML = `
            <div style="
                position:fixed; top:80px; right:20px; width:180px;
                background:rgba(0,0,0,0.92); border:3px solid #ff3333; border-radius:10px;
                padding:12px; font-family:Verdana,sans-serif; z-index:9999; display:none;
                user-select:none;
            ">
                <div style="text-align:center;color:#ff3333;font-size:15px;font-weight:bold;margin-bottom:10px;">⚙ ADMIN PANEL</div>
                <button class="adm-btn" data-action="lvlup">Level +1</button>
                <button class="adm-btn" data-action="lvldown">Level -1</button>
                <button class="adm-btn" data-action="gold">+1000 Gold</button>
                <button class="adm-btn" data-action="heal">Heal Full</button>
                <button class="adm-btn" data-action="kill">Kill All Enemies</button>
            </div>
        `;
        document.body.appendChild(div);
        this.panel = div.querySelector('div');

        // CSS cho buttons
        const style = document.createElement('style');
        style.textContent = `
            .adm-btn {
                display:block; width:100%; padding:7px 0; margin:4px 0;
                background:#333; color:#fff; border:1px solid #666; border-radius:5px;
                font-size:13px; cursor:pointer; font-family:Verdana,sans-serif;
            }
            .adm-btn:hover { background:#555; }
            .adm-btn:active { background:#777; }
        `;
        document.head.appendChild(style);

        // Gán sự kiện cho từng nút
        div.querySelectorAll('.adm-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.handleAction(btn.dataset.action);
            });
        });

        // Phím F2 toggle
        scene.input.keyboard.on('keydown-F2', () => {
            const isHidden = this.panel.style.display === 'none';
            this.panel.style.display = isHidden ? 'block' : 'none';
        });
    }

    handleAction(action) {
        const p = this.player;
        switch(action) {
            case 'lvlup':
                p.setLevel(p.level + 1);
                break;
            case 'lvldown':
                p.setLevel(p.level - 1);
                break;
            case 'gold':
                p.gold += 1000;
                break;
            case 'heal':
                p.hp = p.maxHp;
                p.mp = p.maxMp;
                // Hồi sinh nếu đã chết
                if (p.isDead) {
                    p.isDead = false;
                    p.isInvincible = false;
                    p.setActive(true).setVisible(true);
                    if (p.body) p.body.enable = true;
                    p.clearTint();
                }
                break;
            case 'kill':
                if (this.scene.enemies) {
                    this.scene.enemies.getChildren().forEach(e => {
                        if (e.active && e.hp > 0) e.takeDamage(99999);
                    });
                }
                break;
        }
    }
}
