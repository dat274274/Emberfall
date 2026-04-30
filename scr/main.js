import Player from './Player.js';
import Enemy from './Enemy.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#0a0a1a',
    pixelArt: true,
    roundPixels: true, // Pixel motion mượt mà
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

let player, cursors, wasd, spaceBar, enemies;

function preload() {
    // Báo lỗi chi tiết ra console nếu không tải được file
    this.load.on('loaderror', (file) => {
        console.error('🚨 Không tìm thấy file:', file.src);
    });

    this.load.spritesheet('warrior', 
        'https://labs.phaser.io/assets/sprites/metalslug_mummy37x45.png',
        { frameWidth: 37, frameHeight: 45 }
    );

}

function create() {
    this.physics.world.setBounds(0, 0, 3200, 1800);

    // 1. Tạo Animations trước
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('warrior', { start: 0, end: 17 }),
        frameRate: 20, repeat: -1
    });
    for(let i=1; i<=3; i++) {
        this.anims.create({
            key: `attack_${i}`,
            frames: this.anims.generateFrameNumbers('warrior', { start: (i-1)*6, end: i*6 - 1 }),
            frameRate: 20
        });
    }

    // 2. Khởi tạo Player TRƯỚC (để có player.attackHitbox)
    player = new Player(this, 1600, 900);

    // 3. Khởi tạo Input
    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys('W,A,S,D');
    spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 4. Khởi tạo Enemy Group
    // Đảm bảo bạn đã import Enemy từ './Enemy.js' ở đầu file main.js
    enemies = this.physics.add.group({ 
        classType: Enemy, 
        runChildUpdate: false // Tắt vì chúng ta cần truyền tham số player thủ công
    });

    for (let i = 0; i < 30; i++) {
        // Sinh quái gần người chơi hơn để dễ kiểm tra
        let x = Phaser.Math.Between(1200, 2000);
        let y = Phaser.Math.Between(700, 1100);
        let enemy = enemies.get(x, y);
        
        if (enemy) {
            enemy.setActive(true).setVisible(true);
            // Đảm bảo quái không bị rơi nếu sau này bạn thêm trọng lực
            if (enemy.body) enemy.body.setAllowGravity(false);
        }
    }

    // 5. Thiết lập Camera
    this.cameras.main.setBounds(0, 0, 3200, 1800);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // 6. Thiết lập Va chạm (Sau khi đã có cả player và enemies)
    this.physics.add.overlap(player.attackHitbox, enemies, (hitbox, enemy) => {
        if (hitbox.body.enable && enemy.active) {
            enemy.setActive(false).setVisible(false);
            enemy.body.enable = false;
            player.exp += 20; 
            this.cameras.main.shake(100, 0.005);
            console.log("Đã diệt quái! EXP hiện tại:", player.exp);
        }
    }, null, this);
}

function update(time) {
    if (player) {
        player.update(cursors, wasd, time, spaceBar);
    }

    enemies.children.each((enemy) => {
        if (enemy.active) enemy.update(player);
    });
    if (Phaser.Input.Keyboard.JustDown(spaceBar)) {
    console.log("Vị trí Player:", player.x, player.y);
    enemies.children.each(e => {
        if(e.active) console.log("Quái đang ở:", e.x, e.y);
    });
}
}

new Phaser.Game(config);