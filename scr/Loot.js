// ══════════════════════════════════════════════
// LOOT SYSTEM - Rơi đồ khi quái chết
// ══════════════════════════════════════════════

export default class LootItem extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        super(scene, x, y, `loot_${type}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type = type;
        this.collected = false;
        this.body.setAllowGravity(false);
        this.setDepth(5);
        this.setScale(1.5);

        // Giá trị theo loại
        switch (type) {
            case 'gold':
                this.value = Phaser.Math.Between(10, 25);
                break;
            case 'hp_potion':
                this.value = 30;
                break;
            case 'mp_potion':
                this.value = 20;
                break;
        }

        // Hiệu ứng nảy khi xuất hiện
        const startY = y;
        this.setScale(0);
        this.setAlpha(0);
        scene.tweens.add({
            targets: this,
            y: startY - 25,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 1,
            duration: 300,
            ease: 'Back.Out',
            onComplete: () => {
                scene.tweens.add({
                    targets: this,
                    y: startY,
                    duration: 250,
                    ease: 'Bounce.Out',
                    onComplete: () => {
                        // Hiệu ứng lơ lửng
                        scene.tweens.add({
                            targets: this,
                            y: startY - 6,
                            duration: 900,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.InOut'
                        });
                    }
                });
            }
        });

        // Tự biến mất sau 15 giây
        this.destroyTimer = scene.time.delayedCall(15000, () => {
            if (this.active) {
                scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 500,
                    onComplete: () => { if (this.active) this.destroy(); }
                });
            }
        });
    }

    collect(player) {
        if (this.collected) return;
        this.collected = true;
        if (this.destroyTimer) this.destroyTimer.remove();

        switch (this.type) {
            case 'gold':
                player.gold += this.value;
                player.showFloatingText(`+${this.value} Gold`, '#ffd700');
                break;
            case 'hp_potion':
                player.hp = Math.min(player.maxHp, player.hp + this.value);
                player.showFloatingText(`+${this.value} HP`, '#ff4444');
                break;
            case 'mp_potion':
                player.mp = Math.min(player.maxMp, player.mp + this.value);
                player.showFloatingText(`+${this.value} MP`, '#4488ff');
                break;
        }

        // Hiệu ứng nhặt
        this.body.enable = false;
        this.scene.tweens.add({
            targets: this,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            y: this.y - 30,
            duration: 250,
            onComplete: () => { if (this.active) this.destroy(); }
        });
    }
}
