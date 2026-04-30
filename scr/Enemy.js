export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Sử dụng chung asset 'warrior' với Player
        super(scene, x, y, 'warrior');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Chỉnh quái vật nhỏ hơn Player (Player đang là 1.0)
        this.setScale(0.6);
        this.setCollideWorldBounds(true);
        this.setTint(0xff5555);
        this.body.setSize(20, 20).setOffset(8, 8);
        this.moveSpeed = 150; 
        this.detectRange = 400; 
    }

    update(player) {
        if (!player || !this.active) return;

        // Sử dụng chung animation 'walk' của Player
        if (this.scene.anims.exists('walk')) {
            this.play('walk', true);
        }

        let distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (distance < this.detectRange && distance > 10) {
            // Quay mặt về phía player
            this.flipX = (player.x < this.x);
            // Fix lỗi scene is not defined bằng cách dùng this.scene
            this.scene.physics.moveToObject(this, player, this.moveSpeed);
        } else {
            this.setVelocity(0);
        }
    }
}