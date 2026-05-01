import Player from './Player.js';

export default class DungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DungeonScene' });
    }

    preload() {
        // Assets chung (như Player) đã được load ở MainScene và được cache
        // Chỉ load thêm asset riêng của Dungeon nếu chưa load
        const DUNGEON_PATH = 'asset/dungeon/PNG';
        this.load.image('dungeon_map', `${DUNGEON_PATH}/full.png`);
        this.load.image('dungeon_portal', `${DUNGEON_PATH}/Other_objects.png`);
    }

    create() {
        this.input.mouse.disableContextMenu();

        // Tạo map (giả sử map dungeon có kích thước khoảng 1600x1200)
        const MAP_W = 1600, MAP_H = 1200;
        this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

        // Đặt hình nền dungeon
        const bg = this.add.image(MAP_W / 2, MAP_H / 2, 'dungeon_map').setDepth(0);
        // Nếu ảnh map quá nhỏ, ta scale lên một chút
        bg.setDisplaySize(MAP_W, MAP_H);

        // Viền bóng tối xung quanh map
        const borderGfx = this.add.graphics().setDepth(1);
        borderGfx.fillStyle(0x000000, 1);
        borderGfx.fillRect(0, 0, MAP_W, 30);
        borderGfx.fillRect(0, MAP_H - 30, MAP_W, 30);
        borderGfx.fillRect(0, 0, 30, MAP_H);
        borderGfx.fillRect(MAP_W - 30, 0, 30, MAP_H);

        // Khởi tạo Player tại vị trí cửa vào (phía Nam)
        this.player = new Player(this, MAP_W / 2, MAP_H - 100, 'p1_idle_down');

        // Phím điều khiển
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Camera theo dõi người chơi
        this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBackgroundColor('#000000'); // Nền đen

        // Cổng ra (quay về làng)
        const exitGate = this.add.image(MAP_W / 2, MAP_H - 20, 'dungeon_portal').setDepth(100);
        exitGate.setTint(0x00ff00); // Màu xanh cho cổng ra
        this.physics.add.existing(exitGate, true);

        // Va chạm để quay về
        this.physics.add.overlap(this.player, exitGate, () => {
            this.player.saveProgress();
            this.scene.start('MainScene');
        }, null, this);

        // Thêm chữ chỉ dẫn
        this.add.text(MAP_W / 2, MAP_H - 70, 'Trở Về Làng', {
            fontSize: '20px', fontFamily: 'Arial', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);

        // Chữ chào mừng
        this.add.text(MAP_W / 2, 100, 'VÙNG ĐẤT TỬ THẦN\n(Hầm Ngục)', {
            fontSize: '40px', fontFamily: 'Impact', color: '#ff3333', align: 'center', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(200);
    }

    update(time, delta) {
        if (this.player && this.player.active) {
            this.player.update(this.cursors, this.wasd, time, this.spaceBar, null, null);
            this.player.setDepth(this.player.y);
        }
    }
}
