import LootItem from './Loot.js';

const RESPAWN_DELAY = 15000; // 15 giây hồi sinh
const EXP_REWARD    = 25;    // EXP mỗi con quái

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.5);
        this.setCollideWorldBounds(true);
        this.body.setSize(24, 24).setOffset(4, 4);

        this.moveSpeed   = 150;
        this.detectRange = 350;

        // Stats
        this.hp            = 50;
        this.maxHp         = 50;
        this.damage        = 10;
        this.attackRange   = 32;
        this.attackCooldown = 1200;
        this.lastAttackTime = 0;

        this.isHurt = false;
        this.isDead = false;

        // Vị trí spawn cố định (set từ main.js)
        this.spawnX = x;
        this.spawnY = y;

        // Khung mục tiêu (Target Frame)
        this.targetFrame = scene.add.graphics().setDepth(45);
        this.isTargeted = false;

        // Thanh máu
        this.hpBar = scene.add.graphics().setDepth(50);

        // Nhãn hồi sinh
        this.respawnLabel = scene.add.text(x, y - 40, '', {
            fontSize: '11px', fontFamily: 'Verdana', color: '#aaaaff',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(55);
    }

    drawHealthBar() {
        this.hpBar.clear();
        if (!this.active || this.hp <= 0) return;

        const bw = 40, bh = 5;
        const bx = this.x - bw / 2;
        const by = this.y - 34;

        this.hpBar.fillStyle(0x111111, 0.8);
        this.hpBar.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

        const r = Math.max(0, this.hp / this.maxHp);
        const c = r > 0.5 ? 0xff4444 : r > 0.25 ? 0xff8800 : 0xff0000;
        this.hpBar.fillStyle(c, 1);
        this.hpBar.fillRect(bx, by, bw * r, bh);
    }

    setTargeted(isTargeted) {
        this.isTargeted = isTargeted;
        if (!isTargeted) {
            this.targetFrame.clear();
        }
    }

    update(player, time) {
        if (!this.active) return;

        this.drawHealthBar();

        if (this.isTargeted && !this.isDead && this.hp > 0) {
            this.targetFrame.clear();
            this.targetFrame.lineStyle(2, 0xff0000, 0.8);
            // Vẽ 4 góc khung vuông bao quanh quái
            const s = 18; // nửa kích thước
            const tx = this.x, ty = this.y;
            this.targetFrame.beginPath();
            this.targetFrame.moveTo(tx - s, ty - s + 8);
            this.targetFrame.lineTo(tx - s, ty - s);
            this.targetFrame.lineTo(tx - s + 8, ty - s);
            this.targetFrame.moveTo(tx + s - 8, ty - s);
            this.targetFrame.lineTo(tx + s, ty - s);
            this.targetFrame.lineTo(tx + s, ty - s + 8);
            this.targetFrame.moveTo(tx - s, ty + s - 8);
            this.targetFrame.lineTo(tx - s, ty + s);
            this.targetFrame.lineTo(tx - s + 8, ty + s);
            this.targetFrame.moveTo(tx + s - 8, ty + s);
            this.targetFrame.lineTo(tx + s, ty + s);
            this.targetFrame.lineTo(tx + s, ty + s - 8);
            this.targetFrame.strokePath();
        }

        if (this.isDead || this.hp <= 0) { this.die(); return; }
        if (this.isHurt) return;

        if (!player || !player.active) {
            this.setVelocity(0);
            this.play('enemy_idle', true);
            return;
        }

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (dist < this.attackRange) {
            // Tấn công
            this.setVelocity(0);
            this.flipX = (player.x < this.x);
            this.play('enemy_attack', true);

            if (time - this.lastAttackTime > this.attackCooldown) {
                player.takeDamage(this.damage);
                this.lastAttackTime = time;
                this.setTint(0xffff00);
                this.scene.time.delayedCall(120, () => { if (this.active) this.clearTint(); });
            }
        } else if (dist < this.detectRange) {
            // Đuổi theo
            this.flipX = (player.x < this.x);
            this.scene.physics.moveToObject(this, player, this.moveSpeed);
            this.play('enemy_run', true);
        } else {
            // Tuần tra nhỏ quanh điểm spawn
            this.setVelocity(0);
            this.play('enemy_idle', true);
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;

        // Hiện số máu bị mất
        this.showFloatingText(`-${amount}`, '#ffffff');

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        } else {
            this.isHurt = true;
            this.setTint(0xffffff);
            if (this.scene.anims.exists('enemy_hurt')) {
                this.play('enemy_hurt');
                this.once('animationcomplete', () => {
                    this.isHurt = false;
                    if (this.active) this.clearTint();
                });
            } else {
                this.scene.time.delayedCall(200, () => {
                    this.isHurt = false;
                    if (this.active) this.clearTint();
                });
            }
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setVelocity(0);
        this.body.enable = false;
        this.hpBar.clear();
        this.setTargeted(false);

        // Trao EXP
        if (this.scene.player && this.scene.player.active) {
            this.scene.player.gainExp(EXP_REWARD);
        }

        // Rơi đồ
        const dropChance = Phaser.Math.Between(1, 100);
        if (dropChance <= 80) { // 80% rớt đồ
            const rand = Phaser.Math.Between(1, 100);
            let type = 'gold';
            if (rand <= 20) type = 'mp_potion';
            else if (rand <= 50) type = 'hp_potion';
            
            const loot = new LootItem(this.scene, this.x, this.y, type);
            if (this.scene.loots) this.scene.loots.add(loot);
        }

        this.scene.cameras.main.shake(80, 0.004);

        if (this.scene.anims.exists('enemy_death')) {
            this.play('enemy_death');
            this.once('animationcomplete', () => { this._startRespawnTimer(); });
        } else {
            this._startRespawnTimer();
        }
    }

    // ── FLOATING TEXT ──
    showFloatingText(text, color) {
        const t = this.scene.add.text(this.x, this.y - 45, text, {
            fontSize: '14px', fontFamily: 'Verdana', color: color,
            stroke: '#000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(9999);
        
        this.scene.tweens.add({
            targets: t,
            y: this.y - 75,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => t.destroy()
        });
    }

    _startRespawnTimer() {
        this.setActive(false).setVisible(false);
        const sx = this.spawnX || this.x;
        const sy = this.spawnY || this.y;

        // Hiển thị đếm ngược hồi sinh tại điểm spawn
        let remaining = RESPAWN_DELAY / 1000;
        this.respawnLabel.setPosition(sx, sy - 40).setVisible(true).setText(`⏳ ${remaining}s`);

        const countdown = this.scene.time.addEvent({
            delay: 1000, repeat: Math.floor(RESPAWN_DELAY / 1000) - 1,
            callback: () => {
                remaining--;
                if (this.respawnLabel) this.respawnLabel.setText(`⏳ ${remaining}s`);
            }
        });

        this.scene.time.delayedCall(RESPAWN_DELAY, () => {
            this.respawnLabel.setVisible(false);
            this._respawn(sx, sy);
            countdown.remove();
        });
    }

    _respawn(x, y) {
        this.hp     = this.maxHp;
        this.isDead = false;
        this.isHurt = false;
        this.setPosition(x, y);
        this.setActive(true).setVisible(true);
        this.setTint(0x88ffff); // Flash xanh khi hồi sinh
        this.scene.time.delayedCall(400, () => { if (this.active) this.clearTint(); });
        if (this.body) {
            this.body.enable = true;
            this.body.setAllowGravity(false);
        }
        this.play('enemy_idle', true);
        console.log(`🐗 Quái hồi sinh tại (${x}, ${y})`);
    }
}