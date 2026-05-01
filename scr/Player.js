export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, savedLevel = 1, savedExp = 0) {
        let skin = 'p1';
        if (savedLevel >= 10) skin = 'p3';
        else if (savedLevel >= 5) skin = 'p2';

        super(scene, x, y, `${skin}_idle_down`);
        this.skinPrefix = skin;

        // --- Class System ---
        this.playerClass = window.playerClass || 'warrior';
        this.playerWeapon = window.playerWeapon || 'common';

        scene.add.existing(this);
        scene.physics.add.existing(this);

        if (this.playerClass === 'fire_mage' || this.playerClass === 'elemental_mage') {
            this.setTint(0xff88ff); // Tím hồng cho Elemental
        } else if (this.playerClass === 'smoke_assassin') {
            this.setTint(0x555555); // Xám đen cho Khói
        }

        // Stats
        this.gold = 0;
        this.level = savedLevel;
        this.exp = savedExp;

        let reqExp = 100;
        for (let i = 1; i < this.level; i++) {
            reqExp = Math.floor(reqExp * 1.4);
        }
        this.expToLevelUp = reqExp;

        this.maxHp = Math.max(10, 100 + (this.level - 1) * 20);
        this.hp = this.maxHp;
        this.maxMp = Math.max(5, 50 + (this.level - 1) * 10);
        this.mp = this.maxMp;
        this.damage = 20 + (this.level - 1) * 5;

        // --- WEAPON BOOST (Warrior only) ---
        if (this.playerClass === 'warrior') {
            if (this.playerWeapon === 'uncommon') this.damage += 15;
            if (this.playerWeapon === 'rare') this.damage += 35;
        }

        // Admin debug
        window.player = this;
        window.adminLevelUp = (lvl) => {
            this.exp = 0;
            this.level = lvl - 1;
            this.gainExp(this.expToLevelUp);
        };

        // Hồi mana
        this.manaRegenRate = 2; // hồi 2 MP mỗi giây
        this.lastManaRegen = 0;

        this.setScale(1.5);
        this.setCollideWorldBounds(true);
        this.body.setSize(20, 30).setOffset(22, 28);
        this.moveSpeed = 350;

        // Trạng thái chiến đấu
        this.isAttacking = false;
        this.currentCombo = 1;
        this.lastAttackTime = 0;
        this.comboTimeout = 1000;

        // Hướng nhìn hiện tại bằng chuỗi
        this.facingDir = 'down';

        // Bất tử sau khi bị đánh
        this.isInvincible = false;
        this.invincibleDuration = 500;
        this.isDead = false;

        this.hitEnemies = new Set();
        // projectilesGroup sẽ lấy từ scene.projectiles tại runtime (được tạo sau Player)

        // Hitbox tấn công (hướng)
        this.attackHitbox = scene.add.rectangle(0, 0, 50, 30, 0xff0000, 0);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.enable = false;
        this.attackHitbox.setDepth(20);

        // === SKILL: TORNADO (E) ===
        this.tornadoCooldown = 8000;
        this.lastTornadoTime = -this.tornadoCooldown;
        this.tornadoManaCost = 20;
        this.tornadoDamage = 50;
        this.tornadoRadius = 150;
        this.isTornadoing = false;
        this.tornadoGfx = scene.add.graphics().setDepth(15);

        // === SKILL: DASH SLASH (Q) ===
        this.dashCooldown = 4000;
        this.lastDashTime = -this.dashCooldown;
        this.dashManaCost = 10;
        this.dashDamage = 35;
        this.dashRange = 220;
        this.isDashing = false;
        this.dashGfx = scene.add.graphics().setDepth(15);

        // Auto-pathing
        this.targetEnemy = null;
        this.targetPoint = null;
        this.targetMarker = scene.add.graphics().setDepth(10);

        // Lắng nghe click chuột
        scene.input.on('pointerdown', (pointer) => {
            if (this.isDead || this.isDashing || this.isTornadoing) return;

            const worldX = pointer.worldX;
            const worldY = pointer.worldY;

            if (pointer.leftButtonDown()) {
                // Click trái: Kiểm tra có trúng quái không để target
                const enemies = scene.enemies ? scene.enemies.getChildren() : [];
                const clickedEnemy = enemies.find(e =>
                    e.active && e.hp > 0 && e.getBounds().contains(worldX, worldY)
                );

                if (scene.enemies) {
                    scene.enemies.getChildren().forEach(e => e.setTargeted(false));
                }

                if (clickedEnemy) {
                    this.targetEnemy = clickedEnemy;
                    this.targetPoint = null;
                    this.targetMarker.clear();
                    clickedEnemy.setTargeted(true);

                    // --- Bắn Projectile Nếu Là Mage/Assassin ---
                    if (this.playerClass === 'elemental_mage' || this.playerClass === 'smoke_assassin') {
                        this.fireProjectile(scene, clickedEnemy);
                        // Giữ targeting icon nhưng không tự động chạy tới
                        this.targetPoint = null;
                    }
                } else {
                    // Click trái vào đất: Bỏ chọn, không làm gì
                    this.targetEnemy = null;
                    this.targetPoint = null;
                    this.targetMarker.clear();
                }

            } else if (pointer.rightButtonDown()) {
                // Click phải: Di chuyển đến điểm
                this.targetPoint = { x: worldX, y: worldY };
                this.targetEnemy = null;
                this.rightMouseHeld = true; // Đánh dấu đang giữ chuột phải

                if (scene.enemies) {
                    scene.enemies.getChildren().forEach(e => e.setTargeted(false));
                }

                // Hiệu ứng marker
                this.targetMarker.clear();
                this.targetMarker.x = worldX;
                this.targetMarker.y = worldY;
                this.targetMarker.lineStyle(2, 0x00ff00, 0.8);
                this.targetMarker.strokeCircle(0, 0, 15);
                this.targetMarker.setAlpha(1).setScale(1);

                scene.tweens.add({
                    targets: this.targetMarker,
                    alpha: 0,
                    scale: 0.5,
                    duration: 400,
                    onComplete: () => this.targetMarker.clear()
                });
            }
        });

        // Giữ chuột phải kéo đi → nhân vật đi theo hướng chuột liên tục
        scene.input.on('pointermove', (pointer) => {
            if (this.isDead || !this.rightMouseHeld) return;
            if (pointer.rightButtonDown()) {
                this.targetPoint = { x: pointer.worldX, y: pointer.worldY };
                this.targetEnemy = null;
            }
        });

        scene.input.on('pointerup', (pointer) => {
            // Khi thả chuột phải
            if (pointer.rightButtonReleased()) {
                this.rightMouseHeld = false;
            }
        });

        // HUD
        this.createHUD(scene);
    }

    // ─────────────────────────────────────────────────────
    fireProjectile(scene, target) {
        const time = scene.time.now;
        if (time - this.lastAttackTime < 500) return; // Cooldown đánh thường

        this.lastAttackTime = time;

        // Cập nhật hướng quay về phía target
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facingDir = dx > 0 ? 'right' : 'left';
        } else {
            this.facingDir = dy > 0 ? 'down' : 'up';
        }

        this.isAttacking = true;
        this._attackStartTime = scene.time.now;
        this.setVelocity(0);
        this.play(`${this.skinPrefix}_attack_1_${this.facingDir}`, true);
        this.scene.time.delayedCall(400, () => { this.isAttacking = false; });

        // Chọn Projectile theo Class
        let animKey = 'anim_fire_ball';
        let textureKey = 'fire_ball_1';

        if (this.playerClass === 'elemental_mage') {
            // Đổi luân phiên giữa Lửa và Nước mỗi lần click
            this.altMagic = !this.altMagic;
            if (this.altMagic) {
                animKey = 'anim_water_ball'; textureKey = 'water_ball_1';
            } else {
                animKey = 'anim_fire_ball'; textureKey = 'fire_ball_1';
            }
        } else if (this.playerClass === 'smoke_assassin') {
            textureKey = 'smoke_blow_1';
            animKey = 'anim_smoke_blow';
        }

        const proj = this.scene.projectiles.create(this.x, this.y, textureKey);
        if (animKey) proj.play(animKey);

        if (proj) {
            proj.damage = this.damage;
            proj.setScale(this.playerClass === 'smoke_assassin' ? 0.12 : 0.15);
            scene.physics.add.existing(proj);
            proj.body.setSize(30, 30);

            // Tính góc và bay tới quái (đầu nhỏ hướng về phía quái)
            const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
            proj.setRotation(angle + Math.PI);
            scene.physics.velocityFromRotation(angle, 500, proj.body.velocity);

            // Tự hủy sau 2 giây nếu không trúng
            scene.time.delayedCall(2000, () => {
                if (proj.active) proj.destroy();
            });
        }
    }

    // ─────────────────────────────────────────────────────
    createHUD(scene) {
        const cam = scene.cameras.main;
        const Z = cam.zoom || 1;

        // Tọa độ lề mong muốn
        const marginX = 20;
        const marginY = 20;

        // Công thức tính tọa độ Un-zoomed để xuất hiện ở (marginX, marginY) trên màn hình đã zoom
        const realX = cam.width / 2 - (cam.width / 2 - marginX) / Z;
        const realY = cam.height / 2 - (cam.height / 2 - marginY) / Z;

        this.hud = scene.add.container(realX, realY).setScrollFactor(0).setDepth(9999);
        this.hud.setScale(1 / Z);

        // Frame chính
        const frame = scene.add.graphics();
        frame.fillStyle(0x1a1a1a, 0.85);
        frame.fillRoundedRect(0, 0, 260, 75, 8);
        frame.lineStyle(2, 0x555555);
        frame.strokeRoundedRect(0, 0, 260, 75, 8);
        this.hud.add(frame);

        // Vòng tròn Level
        const lvBox = scene.add.graphics();
        lvBox.fillStyle(0x333333, 1);
        lvBox.fillCircle(35, 37, 25);
        lvBox.lineStyle(3, 0xffd700);
        lvBox.strokeCircle(35, 37, 25);
        this.hud.add(lvBox);

        this.hudLevel = scene.add.text(35, 37, '1', {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.hud.add(this.hudLevel);

        // --- HP Bar ---
        this.hudHpBg = scene.add.graphics();
        this.hudHpBg.fillStyle(0x440000, 1).fillRoundedRect(70, 12, 175, 14, 4);
        this.hud.add(this.hudHpBg);
        this.hudHpFill = scene.add.graphics();
        this.hud.add(this.hudHpFill);
        this.hudHpText = scene.add.text(157, 19, '100 / 100', { fontSize: '10px', fontFamily: 'Verdana', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.hud.add(this.hudHpText);

        // --- MP Bar ---
        this.hudMpBg = scene.add.graphics();
        this.hudMpBg.fillStyle(0x000044, 1).fillRoundedRect(70, 32, 175, 14, 4);
        this.hud.add(this.hudMpBg);
        this.hudMpFill = scene.add.graphics();
        this.hud.add(this.hudMpFill);
        this.hudMpText = scene.add.text(157, 39, '50 / 50', { fontSize: '10px', fontFamily: 'Verdana', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.hud.add(this.hudMpText);

        // --- EXP Bar ---
        this.hudExpBg = scene.add.graphics();
        this.hudExpBg.fillStyle(0x444400, 1).fillRoundedRect(70, 52, 175, 10, 3);
        this.hud.add(this.hudExpBg);
        this.hudExpFill = scene.add.graphics();
        this.hud.add(this.hudExpFill);
        this.hudExpText = scene.add.text(157, 57, '0 / 100', { fontSize: '9px', fontFamily: 'Verdana', color: '#fff' }).setOrigin(0.5);
        this.hud.add(this.hudExpText);

        // Labels (Tên thanh)
        this.hud.add(scene.add.text(75, 19, 'HP', { fontSize: '9px', fontStyle: 'bold', color: '#fff' }).setOrigin(0, 0.5));
        this.hud.add(scene.add.text(75, 39, 'MP', { fontSize: '9px', fontStyle: 'bold', color: '#fff' }).setOrigin(0, 0.5));
        this.hud.add(scene.add.text(75, 57, 'EXP', { fontSize: '8px', fontStyle: 'bold', color: '#fff' }).setOrigin(0, 0.5));

        // Gold
        this.hudGoldText = scene.add.text(250, 15, '💰 0', {
            fontSize: '12px', fontFamily: 'Verdana', color: '#ffd700', fontStyle: 'bold'
        }).setOrigin(1, 0.5);
        this.hud.add(this.hudGoldText);

        // === Skill slots ===
        if (this.playerClass === 'warrior') {
            this._buildSkillSlot(scene, 0, 85, '🌀', '[E]', 'skSlot1', this.tornadoManaCost);
            this._buildSkillSlot(scene, 50, 85, '⚡', '[Q]', 'skSlot2', this.dashManaCost);
            // Weapon Icon
            const wpnKey = 'sword_' + this.playerWeapon;
            const wpnImg = scene.add.image(245, 45, wpnKey).setScale(1.2).setOrigin(1, 0.5);
            this.hud.add(wpnImg);
            this.hud.add(scene.add.text(245, 60, `+${this.damage}`, { fontSize: '10px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(1, 0.5));
        } else if (this.playerClass === 'elemental_mage' || this.playerClass === 'fire_mage') {
            this._buildSkillSlot(scene, 0, 85, '🔥', '[E]', 'skSlot1', 20);
            this._buildSkillSlot(scene, 50, 85, '💧', '[Q]', 'skSlot2', 15);
        } else if (this.playerClass === 'smoke_assassin') {
            this._buildSkillSlot(scene, 0, 85, '🌫️', '[E]', 'skSlot1', 15);
            this._buildSkillSlot(scene, 50, 85, '🔪', '[Q]', 'skSlot2', 10);
        }
    }

    _buildSkillSlot(scene, ox, oy, icon, key, prop, manaCost) {
        const bg = scene.add.graphics();
        bg.fillStyle(0x1a1a3a, 0.9);
        bg.fillRoundedRect(ox, oy, 44, 44, 8);
        bg.lineStyle(2, 0x6666cc);
        bg.strokeRoundedRect(ox, oy, 44, 44, 8);
        this.hud.add(bg);

        const ico = scene.add.text(ox + 22, oy + 14, icon, { fontSize: '18px' }).setOrigin(0.5);
        this.hud.add(ico);
        const kl = scene.add.text(ox + 22, oy + 34, key, { fontSize: '9px', fontFamily: 'Verdana', color: '#99aaff' }).setOrigin(0.5);
        this.hud.add(kl);

        // Hiện MP cost
        const mptx = scene.add.text(ox + 35, oy + 5, String(manaCost), { fontSize: '8px', fontFamily: 'Verdana', color: '#3388ff' }).setOrigin(0.5);
        this.hud.add(mptx);

        const ov = scene.add.graphics(); this.hud.add(ov);
        const tx = scene.add.text(ox + 22, oy + 22, '', { fontSize: '12px', fontFamily: 'Verdana', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.hud.add(tx);

        this[`${prop}Overlay`] = ov;
        this[`${prop}Text`] = tx;
        this[`${prop}Ox`] = ox;
        this[`${prop}Oy`] = oy;
    }

    updateHUD(time) {
        // Hồi Mana
        if (time - this.lastManaRegen >= 1000) {
            if (this.mp < this.maxMp) {
                this.mp = Math.min(this.maxMp, this.mp + this.manaRegenRate);
            }
            this.lastManaRegen = time;
        }

        // HP
        this.hudHpFill.clear();
        const r = Math.max(0, this.hp / this.maxHp);
        const hc = r > 0.5 ? 0xee3333 : r > 0.2 ? 0xff8800 : 0xff0000;
        this.hudHpFill.fillStyle(hc, 1);
        if (r > 0) this.hudHpFill.fillRoundedRect(70, 12, 175 * r, 14, 4);
        this.hudHpText.setText(`${Math.ceil(this.hp)} / ${this.maxHp}`);

        // MP
        this.hudMpFill.clear();
        const mr = Math.max(0, this.mp / this.maxMp);
        this.hudMpFill.fillStyle(0x3388ff, 1);
        if (mr > 0) this.hudMpFill.fillRoundedRect(70, 32, 175 * mr, 14, 4);
        this.hudMpText.setText(`${Math.floor(this.mp)} / ${this.maxMp}`);

        // EXP
        this.hudExpFill.clear();
        const er = Math.min(1, this.exp / this.expToLevelUp);
        this.hudExpFill.fillStyle(0xffd700, 1);
        if (er > 0) this.hudExpFill.fillRoundedRect(70, 52, 175 * er, 10, 3);
        this.hudExpText.setText(`${Math.floor(this.exp)} / ${this.expToLevelUp}`);

        // Level
        this.hudLevel.setText(`${this.level}`);

        // Gold
        this.hudGoldText.setText(`💰 ${this.gold}`);

        // Skill cooldowns
        this._updateSkillCD(time, 'skSlot1', this.tornadoCooldown, this.lastTornadoTime);
        this._updateSkillCD(time, 'skSlot2', this.dashCooldown, this.lastDashTime);
    }

    _updateSkillCD(time, prop, cd, last) {
        const rem = Math.max(0, cd - (time - last));
        const ov = this[`${prop}Overlay`];
        const tx = this[`${prop}Text`];
        const ox = this[`${prop}Ox`];
        const oy = this[`${prop}Oy`];
        ov.clear();
        if (rem > 0) {
            const p = rem / cd;
            ov.fillStyle(0x000000, 0.72);
            const h = 44 * p;
            ov.fillRoundedRect(ox, oy + (44 - h), 44, h, 6);
            tx.setText((rem / 1000).toFixed(1));
        } else {
            tx.setText('');
        }
    }

    // ─────────────────────────────────────────────────────
    update(cursors, wasd, time, spaceBar, skillKey, skillKey2) {
        this.updateHUD(time);

        // Cập nhật hitbox theo hướng nhìn
        this._updateAttackHitboxPos();

        if (this.isTornadoing || this.isDashing) {
            this.setVelocity(0);
            return;
        }

        // An toàn: Nếu isAttacking bị kẹt quá lâu (> 800ms) thì tự reset
        if (this.isAttacking) {
            if (time - this._attackStartTime > 800) {
                this.isAttacking = false;
                this.attackHitbox.body.enable = false;
            } else {
                this.setVelocity(0);
                return;
            }
        }

        // Skill E
        if (skillKey && Phaser.Input.Keyboard.JustDown(skillKey)) {
            if (this.playerClass === 'warrior') {
                if (time - this.lastTornadoTime >= this.tornadoCooldown && this.mp >= this.tornadoManaCost) {
                    this.mp -= this.tornadoManaCost;
                    this.startTornado(time); return;
                }
            } else if (this.playerClass === 'elemental_mage' || this.playerClass === 'fire_mage') {
                if (time - this.lastTornadoTime >= this.tornadoCooldown && this.mp >= 20) {
                    this.mp -= 20;
                    this.castFireSpell(time); return;
                }
            } else if (this.playerClass === 'smoke_assassin') {
                if (time - this.lastTornadoTime >= this.tornadoCooldown && this.mp >= 15) {
                    this.mp -= 15;
                    this.castSmokeTeleport(time); return;
                }
            }
        }

        // Skill Q
        if (skillKey2 && Phaser.Input.Keyboard.JustDown(skillKey2)) {
            if (this.playerClass === 'warrior') {
                if (time - this.lastDashTime >= this.dashCooldown && this.mp >= this.dashManaCost) {
                    this.mp -= this.dashManaCost;
                    this.startDashSlash(time); return;
                }
            } else if (this.playerClass === 'elemental_mage' || this.playerClass === 'water_mage') {
                if (time - this.lastDashTime >= this.dashCooldown && this.mp >= 15) {
                    this.mp -= 15;
                    this.castWaterArrow(time); return;
                }
            } else if (this.playerClass === 'smoke_assassin') {
                if (time - this.lastDashTime >= this.dashCooldown && this.mp >= 10) {
                    this.mp -= 10;
                    this.castSmokeShuriken(time); return;
                }
            }
        }

        // Normal attack: Space
        if (spaceBar && Phaser.Input.Keyboard.JustDown(spaceBar)) {
            if (this.targetEnemy) this.targetEnemy.setTargeted(false);
            this.targetEnemy = null; this.targetPoint = null;
            this.startAttack(time); return;
        }

        if (this.isAttacking) {
            this.setVelocity(0);
            return;
        }

        // Di chuyển
        this.setVelocity(0);
        let isMoving = false, vx = 0, vy = 0;

        const goLeft = cursors.left.isDown || (wasd && wasd.A.isDown);
        const goRight = cursors.right.isDown || (wasd && wasd.D.isDown);
        const goUp = cursors.up.isDown || (wasd && wasd.W.isDown);
        const goDown = cursors.down.isDown || (wasd && wasd.S.isDown);

        // --- MANAUL MOVEMENT ---
        if (goLeft || goRight || goUp || goDown) {
            if (this.targetEnemy) {
                this.targetEnemy.setTargeted(false);
            }
            this.targetEnemy = null;
            this.targetPoint = null;
            if (this.targetMarker) this.targetMarker.clear();

            if (goLeft) vx = -this.moveSpeed;
            else if (goRight) vx = this.moveSpeed;

            if (goUp) vy = -this.moveSpeed;
            else if (goDown) vy = this.moveSpeed;

            isMoving = true;
        } else {
            // --- AUTO PATHING ---
            if (this.targetEnemy) {
                if (!this.targetEnemy.active || this.targetEnemy.hp <= 0) {
                    this.targetEnemy.setTargeted(false);
                    this.targetEnemy = null;
                } else {
                    const dx = this.targetEnemy.x - this.x;
                    const dy = this.targetEnemy.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 70) {
                        const angle = Math.atan2(dy, dx);
                        vx = Math.cos(angle) * this.moveSpeed;
                        vy = Math.sin(angle) * this.moveSpeed;
                        isMoving = true;
                    } else {
                        // Đủ gần -> đánh
                        if (!this.isAttacking) {
                            // Quay mặt về phía quái trước khi chém
                            if (Math.abs(dx) > Math.abs(dy)) {
                                this.facingDir = dx > 0 ? 'right' : 'left';
                            } else {
                                this.facingDir = dy > 0 ? 'down' : 'up';
                            }
                            this._updateAttackHitboxPos();
                            this.startAttack(time);
                            return; // Dừng hàm update để tránh bị đè animation
                        }
                    }
                }
            } else if (this.targetPoint) {
                const dx = this.targetPoint.x - this.x;
                const dy = this.targetPoint.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 5) {
                    const angle = Math.atan2(dy, dx);
                    vx = Math.cos(angle) * this.moveSpeed;
                    vy = Math.sin(angle) * this.moveSpeed;
                    isMoving = true;
                } else {
                    this.targetPoint = null;
                }
            }
        }

        // Cập nhật hướng nhìn
        if (isMoving) {
            // Ưu tiên hướng có vận tốc lớn hơn
            if (Math.abs(vx) > Math.abs(vy)) {
                if (vx < 0) this.facingDir = 'left';
                else if (vx > 0) this.facingDir = 'right';
            } else {
                if (vy < 0) this.facingDir = 'up';
                else if (vy > 0) this.facingDir = 'down';
            }
            this.flipX = false;
        }

        this.setVelocity(vx, vy);
        // Normalize vận tốc để di chuyển chéo không bị nhanh hơn
        if (vx !== 0 && vy !== 0) {
            // Vận tốc auto-pathing bằng angle đã tự chuẩn hóa, nhưng manual thì chưa
            if (goLeft || goRight || goUp || goDown) {
                this.body.velocity.normalize().scale(this.moveSpeed);
            }
        }

        this.play(`${this.skinPrefix}_${isMoving ? 'walk' : 'idle'}_${this.facingDir}`, true);
    }

    // Đặt hitbox attack theo hướng nhìn hiện tại và hỗ trợ đánh chéo
    _updateAttackHitboxPos() {
        const DIST_H = 35; // khoảng ngang
        const DIST_V = 30; // khoảng dọc

        let dx = 0, dy = 0;

        if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
            const angle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        } else if (this.targetEnemy) {
            const angle = Math.atan2(this.targetEnemy.y - this.y, this.targetEnemy.x - this.x);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        } else {
            if (this.facingDir === 'left') dx = -1;
            else if (this.facingDir === 'right') dx = 1;
            else if (this.facingDir === 'up') dy = -1;
            else if (this.facingDir === 'down') dy = 1;
        }

        this.attackHitbox.x = this.x + dx * DIST_H;
        this.attackHitbox.y = this.y + dy * DIST_V;

        if (this.attackHitbox.body) this.attackHitbox.body.setSize(50, 42);
    }

    startAttack(time) {
        this.isAttacking = true;
        this._attackStartTime = time;
        this.setVelocity(0);
        this.hitEnemies.clear();

        if (time - this.lastAttackTime > this.comboTimeout) this.currentCombo = 1;

        this.play(`${this.skinPrefix}_attack_${this.currentCombo}_${this.facingDir}`);
        this.attackHitbox.body.enable = true;

        // Dùng timer cố định 450ms thay vì animationcomplete (để tránh bị đơ)
        this.scene.time.delayedCall(450, () => {
            this.isAttacking = false;
            this.attackHitbox.body.enable = false;
            this.lastAttackTime = time;
            this.currentCombo = (this.currentCombo % 3) + 1;
        });
    }

    // ── KỸ NĂNG 1: LỐC XOÁY (E) ──
    startTornado(time) {
        this.isTornadoing = true;
        this.lastTornadoTime = time;
        this.setVelocity(0);

        const enemies = this.scene.enemies;
        const radius = this.tornadoRadius;
        let angle = 0;
        const duration = 900;

        const timer = this.scene.time.addEvent({
            delay: 16, repeat: Math.floor(duration / 16),
            callback: () => {
                angle += 18;
                const elapsed = this.scene.time.now - time;
                const progress = elapsed / duration;
                const curR = radius * Math.min(1, progress * 2.2);

                this.tornadoGfx.clear();
                // 5 điểm sáng xoay
                for (let i = 0; i < 5; i++) {
                    const a = Phaser.Math.DegToRad(angle + i * 72);
                    const ex = this.x + Math.cos(a) * curR;
                    const ey = this.y + Math.sin(a) * curR * 0.6;
                    this.tornadoGfx.fillStyle(0x88ddff, Math.max(0, 0.8 - progress * 0.6));
                    this.tornadoGfx.fillCircle(ex, ey, Math.max(2, 9 - progress * 6));
                }
                // Vòng ngoài
                this.tornadoGfx.lineStyle(2, 0x66aaff, Math.max(0, 0.5 - progress * 0.4));
                this.tornadoGfx.strokeCircle(this.x, this.y, curR);
                // Vòng trong
                this.tornadoGfx.lineStyle(1, 0xaaddff, Math.max(0, 0.35 - progress * 0.3));
                this.tornadoGfx.strokeCircle(this.x, this.y, curR * 0.55);
            }
        });

        // Damage giữa skill
        this.scene.time.delayedCall(450, () => {
            if (!enemies) return;
            enemies.children.each((e) => {
                if (!e.active || e.hp <= 0) return;
                const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
                if (dist <= radius) {
                    e.takeDamage(this.tornadoDamage);
                    const ang = Phaser.Math.Angle.Between(this.x, this.y, e.x, e.y);
                    e.setVelocity(Math.cos(ang) * 280, Math.sin(ang) * 280);
                    this.scene.time.delayedCall(250, () => { if (e.active) e.setVelocity(0); });
                }
            });
        });

        this.scene.time.delayedCall(duration, () => {
            this.isTornadoing = false;
            this.tornadoGfx.clear();
            timer.remove();
        });
        this.scene.cameras.main.shake(300, 0.003);
    }

    // ── KỸ NĂNG 2: DASH SLASH / XUNG KÍCH (Q) ──
    startDashSlash(time) {
        this.isDashing = true;
        this.lastDashTime = time;

        let dirX = 0, dirY = 0;
        if (this.facingDir === 'left') dirX = -1;
        else if (this.facingDir === 'right') dirX = 1;
        else if (this.facingDir === 'up') dirY = -1;
        else if (this.facingDir === 'down') dirY = 1;
        const dist = this.dashRange;

        // Tạo vệt chém
        const startX = this.x, startY = this.y;
        const endX = startX + dirX * dist;
        const endY = startY + dirY * dist;

        this.scene.tweens.add({
            targets: this,
            x: endX, y: endY,
            duration: 200,
            ease: 'Quad.Out',
            onStart: () => {
                this.hitEnemies.clear();
                this.attackHitbox.body.enable = true;
            },
            onUpdate: () => {
                // Vệt sáng
                this.dashGfx.clear();
                this.dashGfx.lineStyle(4, 0xffffff, 0.7);
                this.dashGfx.lineBetween(startX, startY, this.x, this.y);
                this.dashGfx.lineStyle(2, 0x66ccff, 0.5);
                this.dashGfx.lineBetween(startX + 5, startY + 5, this.x + 5, this.y + 5);

                // Gây sát thương cho quái trong đường dash
                const enemies = this.scene.enemies;
                if (enemies) {
                    enemies.children.each((e) => {
                        if (!e.active || e.hp <= 0 || this.hitEnemies.has(e)) return;
                        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
                        if (d < 60) {
                            e.takeDamage(this.dashDamage);
                            this.hitEnemies.add(e);
                        }
                    });
                }
            },
            onComplete: () => {
                this.isDashing = false;
                this.attackHitbox.body.enable = false;
                this.dashGfx.clear();
                this.hitEnemies.clear();
            }
        });

        // Flash hiệu ứng
        this.scene.cameras.main.shake(150, 0.004);
        this.setTint(0xaaddff);
        this.scene.time.delayedCall(200, () => { if (this.active) this.clearTint(); });
    }

    // ── NHẬN SÁT THƯƠNG ──
    takeDamage(amount) {
        if (this.isDead || this.isInvincible) return;
        this.hp -= amount;

        // Hiện số sát thương nhận vào
        this.showFloatingText(`-${amount}`, '#ff3333');

        if (this.hp <= 0) {
            this.hp = 0; this.die();
        } else {
            this.isInvincible = true;
            this.setTint(0xff4444);
            this.scene.time.delayedCall(this.invincibleDuration, () => {
                this.isInvincible = false;
                this.clearTint();
            });
            this.scene.cameras.main.shake(60, 0.002);
        }
    }

    // ── NHẬN EXP ──
    gainExp(amount) {
        this.exp += amount;
        this.showFloatingText(`+${amount} EXP`, '#ffaa00');

        if (this.exp >= this.expToLevelUp) {
            this.exp -= this.expToLevelUp;
            this.level++;
            this.expToLevelUp = Math.floor(this.expToLevelUp * 1.4);

            // Tăng chỉ số
            this.maxHp += 20;
            this.hp = this.maxHp;
            this.maxMp += 10;
            this.mp = this.maxMp;
            this.damage += 5;

            // Hiệu ứng Level Up
            this.showFloatingText('LEVEL UP!', '#ffff00', 24);
            console.log(`🎉 LEVEL UP! Lv.${this.level} | HP:${this.maxHp} | DMG:${this.damage}`);

            // Check skin change
            let newSkin = this.skinPrefix;
            if (this.level >= 10) newSkin = 'p3';
            else if (this.level >= 5) newSkin = 'p2';

            if (newSkin !== this.skinPrefix) {
                this.skinPrefix = newSkin;
                this.showFloatingText('NEW ARMOR!', '#00ffff', 24);
            }

            // Flash vàng
            this.setTint(0xffff00);
            this.scene.time.delayedCall(500, () => { if (this.active) this.clearTint(); });
            this.scene.cameras.main.shake(200, 0.005);

            this.saveProgress();
        }
    }

    // ── ADMIN SET LEVEL ──
    setLevel(lvl) {
        if (lvl < 1) lvl = 1;
        this.level = lvl;
        this.exp = 0;

        // Reset stats theo level
        let reqExp = 100;
        for (let i = 1; i < this.level; i++) {
            reqExp = Math.floor(reqExp * 1.4);
        }
        this.expToLevelUp = reqExp;

        this.maxHp = 100 + (this.level - 1) * 20;
        this.hp = this.maxHp;
        this.maxMp = 50 + (this.level - 1) * 10;
        this.mp = this.maxMp;
        this.damage = 20 + (this.level - 1) * 5;

        // Check skin change
        if (this.level >= 10) this.skinPrefix = 'p3';
        else if (this.level >= 5) this.skinPrefix = 'p2';
        else this.skinPrefix = 'p1';

        this.showFloatingText(`SET LV.${this.level}`, '#ff00ff', 24);
        this.saveProgress();
    }

    saveProgress() {
        localStorage.setItem('calamity_save', JSON.stringify({
            level: this.level,
            exp: this.exp
        }));
    }

    // ── FLOATING TEXT ──
    showFloatingText(text, color, size = 16) {
        const t = this.scene.add.text(this.x, this.y - 40, text, {
            fontSize: `${size}px`, fontFamily: 'Verdana', color: color,
            stroke: '#000', strokeThickness: 4, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(9999);

        this.scene.tweens.add({
            targets: t,
            y: this.y - 80,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => t.destroy()
        });
    }

    // ─────────────────────────────────────────────────────
    // === NEW MAGIC SKILLS ===
    // ─────────────────────────────────────────────────────

    castFireSpell(time) {
        this.lastTornadoTime = time;
        const ptr = this.scene.input.activePointer;

        // Hướng mặt về con trỏ
        const dx = ptr.worldX - this.x; const dy = ptr.worldY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) this.facingDir = dx > 0 ? 'right' : 'left';
        else this.facingDir = dy > 0 ? 'down' : 'up';

        this.isAttacking = true;
        this._attackStartTime = time;
        this.setVelocity(0);
        this.play(`${this.skinPrefix}_attack_1_${this.facingDir}`, true);
        this.scene.time.delayedCall(400, () => { this.isAttacking = false; });

        // AOE Nổ ngay tại VỊ TRÍ NHÂN VẬT (theo hướng nhìn)
        const spellDist = 60;
        let sx = this.x, sy = this.y;
        if (this.facingDir === 'right') sx += spellDist;
        else if (this.facingDir === 'left') sx -= spellDist;
        else if (this.facingDir === 'down') sy += spellDist;
        else if (this.facingDir === 'up') sy -= spellDist;

        const aoe = this.scene.add.sprite(sx, sy, 'fire_spell_1').setScale(0.4).setDepth(sy);
        aoe.play('anim_fire_spell');

        // Gây sát thương diện rộng (tại vị trí phép nổ)
        this.scene.time.delayedCall(200, () => {
            if (this.scene.enemies) {
                this.scene.enemies.getChildren().forEach(enemy => {
                    if (enemy.active && enemy.hp > 0) {
                        const dist = Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y);
                        if (dist < 80) enemy.takeDamage(this.damage * 2);
                    }
                });
            }
        });

        aoe.on('animationcomplete', () => { aoe.destroy(); });
    }

    castWaterArrow(time) {
        this.lastDashTime = time;
        const ptr = this.scene.input.activePointer;

        // Hướng mặt về con trỏ
        const dx = ptr.worldX - this.x; const dy = ptr.worldY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) this.facingDir = dx > 0 ? 'right' : 'left';
        else this.facingDir = dy > 0 ? 'down' : 'up';

        this.isAttacking = true;
        this._attackStartTime = time;
        this.setVelocity(0);
        this.play(`${this.skinPrefix}_attack_1_${this.facingDir}`, true);
        this.scene.time.delayedCall(400, () => { this.isAttacking = false; });

        // Bắn một mũi tên nước cực nhanh
        const proj = this.scene.projectiles.create(this.x, this.y, 'water_arrow_1');
        proj.play('anim_water_arrow');
        proj.damage = this.damage * 1.5;
        proj.setScale(0.35);
        this.scene.physics.add.existing(proj);
        proj.body.setSize(40, 40);

        const angle = Phaser.Math.Angle.Between(this.x, this.y, ptr.worldX, ptr.worldY);
        proj.setRotation(angle + Math.PI);
        this.scene.physics.velocityFromRotation(angle, 800, proj.body.velocity);

        this.scene.time.delayedCall(1500, () => { if (proj.active) proj.destroy(); });
    }

    castSmokeTeleport(time) {
        this.lastTornadoTime = time;
        const ptr = this.scene.input.activePointer;

        // Hướng mặt về con trỏ
        const dx = ptr.worldX - this.x; const dy = ptr.worldY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) this.facingDir = dx > 0 ? 'right' : 'left';
        else this.facingDir = dy > 0 ? 'down' : 'up';

        // Hiệu ứng khói nổ tại chỗ cũ
        const smoke1 = this.scene.add.sprite(this.x, this.y, 'smoke_explosion_1').setScale(0.3).setDepth(this.y);
        smoke1.play('anim_smoke_explosion');
        smoke1.on('animationcomplete', () => smoke1.destroy());

        // Dịch chuyển
        this.setPosition(ptr.worldX, ptr.worldY);

        // Hiệu ứng khói tại chỗ mới
        const smoke2 = this.scene.add.sprite(this.x, this.y, 'smoke_1').setScale(0.3).setDepth(this.y);
        smoke2.play('anim_smoke');
        smoke2.on('animationcomplete', () => smoke2.destroy());

        // Gây sát thương xung quanh khi đáp xuống
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemy => {
                if (enemy.active && enemy.hp > 0) {
                    if (Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) < 60) {
                        enemy.takeDamage(this.damage);
                    }
                }
            });
        }
    }

    castSmokeShuriken(time) {
        this.lastDashTime = time;
        const ptr = this.scene.input.activePointer;

        // Hướng mặt về con trỏ
        const dx = ptr.worldX - this.x; const dy = ptr.worldY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) this.facingDir = dx > 0 ? 'right' : 'left';
        else this.facingDir = dy > 0 ? 'down' : 'up';

        this.isAttacking = true;
        this._attackStartTime = time;
        this.setVelocity(0);
        this.play(`${this.skinPrefix}_attack_1_${this.facingDir}`, true);
        this.scene.time.delayedCall(400, () => { this.isAttacking = false; });

        // Ném khói độc bay đi như phi tiêu
        const proj = this.scene.projectiles.create(this.x, this.y, 'poison_smoke_1');
        proj.play('anim_poison_smoke');
        proj.damage = this.damage * 1.2;
        proj.setScale(0.2);
        this.scene.physics.add.existing(proj);
        proj.body.setSize(30, 30);
        proj.body.angularVelocity = 1000; // Xoay vòng vòng

        const angle = Phaser.Math.Angle.Between(this.x, this.y, ptr.worldX, ptr.worldY);
        this.scene.physics.velocityFromRotation(angle, 600, proj.body.velocity);

        this.scene.time.delayedCall(1500, () => { if (proj.active) proj.destroy(); });
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.isInvincible = true;
        this.setVelocity(0);

        this.saveProgress();

        // Hiện "YOU DIED" 1 lần
        const cam = this.scene.cameras.main;
        const deathText = this.scene.add.text(cam.midPoint.x, cam.midPoint.y, 'YOU DIED', {
            fontSize: '56px', fontFamily: 'Impact', color: '#ff0000',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(10000);

        // Fade đỏ nhẹ
        cam.shake(300, 0.01);

        // Sau 1.5 giây: hồi sinh tại điểm spawn
        this.scene.time.delayedCall(1500, () => {
            deathText.destroy();

            // Reset trạng thái
            this.isDead = false;
            this.isInvincible = false;
            this.hp = this.maxHp;
            this.mp = this.maxMp;
            this.setPosition(1600, 900); // Vị trí spawn ban đầu
            this.setActive(true).setVisible(true);
            if (this.body) this.body.enable = true;
            this.clearTint();
            this.play(`${this.skinPrefix}_idle_down`, true);

            // Bất tử 2 giây sau khi hồi sinh
            this.isInvincible = true;
            this.setAlpha(0.6);
            this.scene.time.delayedCall(2000, () => {
                this.isInvincible = false;
                this.setAlpha(1);
            });
        });
    }
}