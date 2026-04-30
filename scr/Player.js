export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'warrior');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Stats nhân vật
        this.hp = 100;
        this.maxHp = 100;
        this.exp = 0;
        this.level = 1;

        // Cấu hình hiển thị (vibe Calamity)
        this.setScale(1.0); 
        this.setCollideWorldBounds(true);
        this.body.setSize(20, 30).setOffset(8, 10);
        this.moveSpeed = 350;

        // Trạng thái chiến đấu
        this.isAttacking = false;
        this.currentCombo = 1;
        this.lastAttackTime = 0;
        this.comboTimeout = 1000;

        // Hitbox tấn công cận chiến
        this.attackHitbox = scene.add.rectangle(0, 0, 40, 50, 0xff0000, 0);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.enable = false;

        // Đồ họa thanh máu
        this.hpBar = scene.add.graphics();
    }

    update(cursors, wasd, time, spaceBar) {
        // Luôn vẽ thanh máu và cập nhật vị trí hitbox
        this.drawHealthBar();
        this.attackHitbox.x = this.flipX ? this.x - 25 : this.x + 25;
        this.attackHitbox.y = this.y;

        if (this.isAttacking) {
            this.setVelocity(0);
            return;
        }

        // Kiểm tra tấn công (Fix lỗi undefined bằng cách check spaceBar tồn tại)
        if (spaceBar && Phaser.Input.Keyboard.JustDown(spaceBar)) {
            this.startAttack(time);
            return;
        }

        this.setVelocity(0);
        let isMoving = false;
        let velocityX = 0;
        let velocityY = 0;

        // Điều khiển WASD + Mũi tên
        if (cursors.left.isDown || (wasd && wasd.A.isDown)) {
            velocityX = -this.moveSpeed;
            this.flipX = true;
            isMoving = true;
        } else if (cursors.right.isDown || (wasd && wasd.D.isDown)) {
            velocityX = this.moveSpeed;
            this.flipX = false;
            isMoving = true;
        }

        if (cursors.up.isDown || (wasd && wasd.W.isDown)) {
            velocityY = -this.moveSpeed;
            isMoving = true;
        } else if (cursors.down.isDown || (wasd && wasd.S.isDown)) {
            velocityY = this.moveSpeed;
            isMoving = true;
        }

        this.setVelocity(velocityX, velocityY);

        // Fix lỗi đi chéo nhanh hơn đi thẳng
        if (velocityX !== 0 && velocityY !== 0) {
            this.body.velocity.normalize().scale(this.moveSpeed);
        }

        if (isMoving) {
            this.play('walk', true);
        } else {
            this.anims.stop();
            this.setFrame(0);
        }
    }

    startAttack(time) {
        this.isAttacking = true;
        this.setVelocity(0);

        if (time - this.lastAttackTime > this.comboTimeout) {
            this.currentCombo = 1;
        }

        this.play(`attack_${this.currentCombo}`);
        this.attackHitbox.body.enable = true;

        this.once('animationcomplete', () => {
            this.isAttacking = false;
            this.attackHitbox.body.enable = false;
            this.lastAttackTime = time;
            this.currentCombo = (this.currentCombo % 3) + 1;
        });
    }

    drawHealthBar() {
        this.hpBar.clear();
        this.hpBar.fillStyle(0x000000, 0.8);
        this.hpBar.fillRect(this.x - 20, this.y - 35, 40, 5);
        const healthWidth = (this.hp / this.maxHp) * 40;
        this.hpBar.fillStyle(0xff0000, 1);
        this.hpBar.fillRect(this.x - 20, this.y - 35, healthWidth, 5);
    }
}