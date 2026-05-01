import Player from './Player.js';
import Enemy from './Enemy.js';
import LootItem from './Loot.js';
import AdminPanel from './AdminPanel.js';
import DungeonScene from './DungeonScene.js';

let player, cursors, wasd, spaceBar, skillKey, skillKey2, enemies;

const SWORDSMAN_PATH_1 = 'asset/sword_man/PNG/Swordsman_lvl1/Without_shadow';
const SWORDSMAN_PATH_2 = 'asset/sword_man/PNG/Swordsman_lvl2/Without_shadow';
const SWORDSMAN_PATH_3 = 'asset/sword_man/PNG/Swordsman_lvl3/Without_shadow';
const BOAR_PATH      = 'asset/animal/PNG/Without_shadow/Boar';
const ROCK_PATH      = 'asset/stone/PNG/Objects_separately';
const TREE_PATH      = 'asset/tree/PNG/Assets_separately/Trees';

const SWORDSMAN_FRAME = { frameWidth: 64, frameHeight: 64 };
const BOAR_FRAME      = { frameWidth: 32, frameHeight: 32 };

// ── Vị trí spawn cố định của quái (thiết kế theo map) ──
// Map 3200×1800, player spawn (1600, 900) = trung tâm
const ENEMY_SPAWNS = [
    // Khu vực phía Bắc (rừng trên)
    { x: 900,  y: 350 }, { x: 1100, y: 300 }, { x: 1300, y: 250 }, { x: 1500, y: 350 },
    { x: 1700, y: 300 }, { x: 1900, y: 400 }, { x: 2100, y: 280 },
    // Khu vực phía Đông (cánh đồng đá)
    { x: 2400, y: 700 }, { x: 2500, y: 850 }, { x: 2600, y: 1000 }, { x: 2450, y: 1150 },
    { x: 2700, y: 600 },
    // Khu vực phía Nam (vùng tối)
    { x: 800,  y: 1400 }, { x: 1000, y: 1500 }, { x: 1200, y: 1450 }, { x: 1500, y: 1550 },
    { x: 1700, y: 1480 }, { x: 2000, y: 1400 }, { x: 2200, y: 1550 },
    // Khu vực phía Tây (ven rừng)
    { x: 400,  y: 700 }, { x: 350,  y: 900 }, { x: 450,  y: 1100 }, { x: 500,  y: 600 },
    // Trung tâm-gần (để dễ test)
    { x: 1300, y: 750 }, { x: 1900, y: 750 }, { x: 1600, y: 600 }, { x: 1600, y: 1200 },
    { x: 1400, y: 1100 }, { x: 1800, y: 1100 },
];

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
    this.load.on('loaderror', (file) => {
        console.error('🚨 Không tìm thấy file:', file.src);
    });

    // === PLAYER SKINS ===
    const skins = [
        { prefix: 'p1', path: SWORDSMAN_PATH_1, lvl: '1' },
        { prefix: 'p2', path: SWORDSMAN_PATH_2, lvl: '2' },
        { prefix: 'p3', path: SWORDSMAN_PATH_3, lvl: '3' }
    ];

    skins.forEach(s => {
        this.load.spritesheet(`${s.prefix}_idle`,        `${s.path}/Swordsman_lvl${s.lvl}_Idle_without_shadow.png`,        SWORDSMAN_FRAME);
        this.load.spritesheet(`${s.prefix}_walk`,        `${s.path}/Swordsman_lvl${s.lvl}_Walk_without_shadow.png`,        SWORDSMAN_FRAME);
        this.load.spritesheet(`${s.prefix}_run`,         `${s.path}/Swordsman_lvl${s.lvl}_Run_without_shadow.png`,         SWORDSMAN_FRAME);
        this.load.spritesheet(`${s.prefix}_attack`,      `${s.path}/Swordsman_lvl${s.lvl}_attack_without_shadow.png`,      SWORDSMAN_FRAME);
        this.load.spritesheet(`${s.prefix}_run_attack`,  `${s.path}/Swordsman_lvl${s.lvl}_Run_Attack_without_shadow.png`,  SWORDSMAN_FRAME);
        this.load.spritesheet(`${s.prefix}_walk_attack`, `${s.path}/Swordsman_lvl${s.lvl}_Walk_Attack_without_shadow.png`, SWORDSMAN_FRAME);
        this.load.spritesheet(`${s.prefix}_hurt`,        `${s.path}/Swordsman_lvl${s.lvl}_Hurt_without_shadow.png`,        SWORDSMAN_FRAME);
        this.load.spritesheet(`${s.prefix}_death`,       `${s.path}/Swordsman_lvl${s.lvl}_Death_without_shadow.png`,       SWORDSMAN_FRAME);
    });

    // === ENEMY ===
    this.load.spritesheet('enemy_idle',   `${BOAR_PATH}/Boar_Idle.png`,   BOAR_FRAME);
    this.load.spritesheet('enemy_walk',   `${BOAR_PATH}/Boar_Walk.png`,   BOAR_FRAME);
    this.load.spritesheet('enemy_run',    `${BOAR_PATH}/Boar_Run.png`,    BOAR_FRAME);
    this.load.spritesheet('enemy_attack', `${BOAR_PATH}/Boar_Attack.png`, BOAR_FRAME);
    this.load.spritesheet('enemy_hurt',   `${BOAR_PATH}/Boar_Hurt.png`,   BOAR_FRAME);
    this.load.spritesheet('enemy_death',  `${BOAR_PATH}/Boar_Death.png`,  BOAR_FRAME);

    // === NEW SUMMER MAP ASSETS ===
    const MAP_PATH = 'asset/map/PNG';
    this.load.image('ground_grass', `${MAP_PATH}/Top-Down Simple Summer_Ground 52.png`);
    this.load.image('ground_dirt', `${MAP_PATH}/Top-Down Simple Summer_Ground 23.png`);
    this.load.image('prop_house', `${MAP_PATH}/Top-Down Simple Summer_Prop - House.png`);
    this.load.image('prop_windmill', `${MAP_PATH}/Top-Down Simple Summer_Prop - Windmill.png`);
    this.load.image('prop_castle', `${MAP_PATH}/Top-Down Simple Summer_Prop - Castle Round.png`);
    this.load.image('prop_tent', `${MAP_PATH}/Top-Down Simple Summer_Prop - Tent.png`);
    this.load.image('prop_well', `${MAP_PATH}/Top-Down Simple Summer_Prop - Well.png`);
    this.load.image('prop_bridge', `${MAP_PATH}/Top-Down Simple Summer_Prop - Wooden Bridge Horizontal.png`);
    this.load.image('prop_tree_L', `${MAP_PATH}/Top-Down Simple Summer_prop - Tree Large.png`);
    this.load.image('prop_tree_M', `${MAP_PATH}/Top-Down Simple Summer_Prop - Tree Medium.png`);
    this.load.image('prop_chest', `${MAP_PATH}/Top-Down Simple Summer_Prop - Treasure Chest.png`);
    this.load.image('prop_campfire', `${MAP_PATH}/Top-Down Simple Summer_Prop - Campfire.png`);

    // === MAGIC ASSETS ===
    const MAGIC_PATH = 'asset/magic';
    for(let i=1; i<=8; i++) {
        this.load.image(`fire_ball_${i}`, `${MAGIC_PATH}/Fire Ball/PNG/Fire Ball_Frame_0${i}.png`);
        this.load.image(`fire_arrow_${i}`, `${MAGIC_PATH}/Fire Arrow/PNG/Fire Arrow_Frame_0${i}.png`);
        this.load.image(`fire_spell_${i}`, `${MAGIC_PATH}/Fire Spell/PNG/Fire Spell_Frame_0${i}.png`);
        this.load.image(`water_arrow_${i}`, `${MAGIC_PATH}/Water Arrow/PNG/Water Arrow_Frame_0${i}.png`);
        this.load.image(`water_spell_${i}`, `${MAGIC_PATH}/Water Spell/PNG/Water Spell_Frame_0${i}.png`);
    }
    for(let i=1; i<=9; i++) {
        this.load.image(`water_ball_${i}`, `${MAGIC_PATH}/Water Ball/PNG/Water Ball_Frame_0${i}.png`);
    }
    for(let i=10; i<=12; i++) {
        this.load.image(`water_ball_${i}`, `${MAGIC_PATH}/Water Ball/PNG/Water Ball_Frame_${i}.png`);
    }

    // === SMOKE ASSETS (NEW) ===
    const SMOKE_PATH = 'asset/smoke';
    for(let i=1; i<=12; i++) {
        const pad = i < 10 ? `0${i}` : `${i}`;
        this.load.image(`smoke_blow_${i}`, `${SMOKE_PATH}/Smoke Blow/PNG/Smoke Blow_Frame_${pad}.png`);
    }
    for(let i=1; i<=16; i++) {
        const pad = i < 10 ? `0${i}` : `${i}`;
        this.load.image(`smoke_explosion_${i}`, `${SMOKE_PATH}/Smoke Explosion/PNG/Smoke Explosion_Frame_${pad}.png`);
    }
    for(let i=1; i<=10; i++) {
        const pad = i < 10 ? `0${i}` : `${i}`;
        this.load.image(`smoke_spell_${i}`, `${SMOKE_PATH}/Smoke Spell/PNG/Smoke Spell_Frame_${pad}.png`);
        this.load.image(`smoke_${i}`, `${SMOKE_PATH}/Smoke/PNG/Smoke_Frame_${pad}.png`);
    }
    for(let i=1; i<=8; i++) {
        this.load.image(`chem_smoke_${i}`, `${SMOKE_PATH}/Chemical Smoke/PNG/Chemical Smoke_Frame_0${i}.png`);
    }
    for(let i=1; i<=12; i++) {
        const pad = i < 10 ? `0${i}` : `${i}`;
        this.load.image(`poison_smoke_${i}`, `${SMOKE_PATH}/Poisonous Smoke/PNG/Posionous Smoke_Frame_${pad}.png`);
    }
    // Legacy smoke (for teleport effect)
    this.load.image('smoke_anim', 'asset/home/PNG/Smoke_animation.png');

    // === WEAPON ICONS (SWORDS) ===
    const WEAPON_PATH = 'asset/weapon/Icons';
    this.load.image('sword_common', `${WEAPON_PATH}/icon_32_2_01.png`);
    this.load.image('sword_uncommon', `${WEAPON_PATH}/icon_32_2_10.png`);
    this.load.image('sword_rare', `${WEAPON_PATH}/icon_32_2_11.png`);

    // === OLD MAP OBJECTS (Fallback) ===
    this.load.image('rock1', `${ROCK_PATH}/Rock1_1.png`);
    this.load.image('rock2', `${ROCK_PATH}/Rock2_1.png`);
    this.load.image('rock3', `${ROCK_PATH}/Rock4_1.png`);
    this.load.image('rock4', `${ROCK_PATH}/Rock8_1.png`);
    this.load.image('tree1', `${TREE_PATH}/Tree1.png`);
    this.load.image('tree2', `${TREE_PATH}/Moss_tree1.png`);
    this.load.image('tree3', `${TREE_PATH}/Autumn_tree1.png`);
    this.load.image('tree4', `${TREE_PATH}/Broken_tree1.png`);
}

    create() {
    // Vô hiệu hóa menu chuột phải mặc định
    this.input.mouse.disableContextMenu();
    
    // Khởi tạo Animation cho Magic
    this.anims.create({
        key: 'anim_fire_ball',
        frames: [{ key: 'fire_ball_1' }, { key: 'fire_ball_2' }, { key: 'fire_ball_3' }, { key: 'fire_ball_4' },
                 { key: 'fire_ball_5' }, { key: 'fire_ball_6' }, { key: 'fire_ball_7' }, { key: 'fire_ball_8' }],
        frameRate: 15, repeat: -1
    });
    this.anims.create({
        key: 'anim_water_ball',
        frames: [{ key: 'water_ball_1' }, { key: 'water_ball_2' }, { key: 'water_ball_3' }, { key: 'water_ball_4' },
                 { key: 'water_ball_5' }, { key: 'water_ball_6' }, { key: 'water_ball_7' }, { key: 'water_ball_8' },
                 { key: 'water_ball_9' }, { key: 'water_ball_10' }, { key: 'water_ball_11' }, { key: 'water_ball_12' }],
        frameRate: 15, repeat: -1
    });
    this.anims.create({
        key: 'anim_fire_arrow',
        frames: [{ key: 'fire_arrow_1' }, { key: 'fire_arrow_2' }, { key: 'fire_arrow_3' }, { key: 'fire_arrow_4' },
                 { key: 'fire_arrow_5' }, { key: 'fire_arrow_6' }, { key: 'fire_arrow_7' }, { key: 'fire_arrow_8' }],
        frameRate: 15, repeat: -1
    });
    this.anims.create({
        key: 'anim_water_arrow',
        frames: [{ key: 'water_arrow_1' }, { key: 'water_arrow_2' }, { key: 'water_arrow_3' }, { key: 'water_arrow_4' },
                 { key: 'water_arrow_5' }, { key: 'water_arrow_6' }, { key: 'water_arrow_7' }, { key: 'water_arrow_8' }],
        frameRate: 15, repeat: -1
    });
    this.anims.create({
        key: 'anim_fire_spell',
        frames: [{ key: 'fire_spell_1' }, { key: 'fire_spell_2' }, { key: 'fire_spell_3' }, { key: 'fire_spell_4' },
                 { key: 'fire_spell_5' }, { key: 'fire_spell_6' }, { key: 'fire_spell_7' }, { key: 'fire_spell_8' }],
        frameRate: 15, repeat: 0 // AOE nổ xong thì tắt
    });
    this.anims.create({
        key: 'anim_water_spell',
        frames: [{ key: 'water_spell_1' }, { key: 'water_spell_2' }, { key: 'water_spell_3' }, { key: 'water_spell_4' },
                 { key: 'water_spell_5' }, { key: 'water_spell_6' }, { key: 'water_spell_7' }, { key: 'water_spell_8' }],
        frameRate: 15, repeat: 0
    });

    // === SMOKE ANIMATIONS ===
    const makeFrames = (prefix, count) => {
        const f = [];
        for(let i=1; i<=count; i++) f.push({ key: `${prefix}_${i}` });
        return f;
    };
    this.anims.create({ key: 'anim_smoke_blow', frames: makeFrames('smoke_blow', 12), frameRate: 15, repeat: -1 });
    this.anims.create({ key: 'anim_smoke_explosion', frames: makeFrames('smoke_explosion', 16), frameRate: 18, repeat: 0 });
    this.anims.create({ key: 'anim_smoke_spell', frames: makeFrames('smoke_spell', 10), frameRate: 15, repeat: 0 });
    this.anims.create({ key: 'anim_smoke', frames: makeFrames('smoke', 10), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'anim_chem_smoke', frames: makeFrames('chem_smoke', 8), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'anim_poison_smoke', frames: makeFrames('poison_smoke', 12), frameRate: 15, repeat: -1 });
    
    const MAP_W = 3200, MAP_H = 1800;
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // ── Nền cỏ bằng TileSprite (lặp lại texture cỏ vô tận để nhẹ máy) ──
    const ground = this.add.tileSprite(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 'ground_grass').setDepth(0);

    // ── Khu vực Làng (Village) tại trung tâm (1600, 900) ──
    // Nền đất trung tâm làng
    this.add.tileSprite(1600, 900, 800, 600, 'ground_dirt').setDepth(0).setAlpha(0.9);
    // Nền đường mòn
    this.add.tileSprite(1600, 1200, 200, 600, 'ground_dirt').setDepth(0).setAlpha(0.9);
    this.add.tileSprite(1200, 900, 800, 150, 'ground_dirt').setDepth(0).setAlpha(0.9);
    this.add.tileSprite(2000, 900, 800, 150, 'ground_dirt').setDepth(0).setAlpha(0.9);

    // ── Borders / tường đá viền map ──
    const borderGfx = this.add.graphics().setDepth(1);
    borderGfx.fillStyle(0x333333, 0.8);
    borderGfx.fillRect(0, 0, MAP_W, 30);
    borderGfx.fillRect(0, MAP_H - 30, MAP_W, 30);
    borderGfx.fillRect(0, 0, 30, MAP_H);
    borderGfx.fillRect(MAP_W - 30, 0, 30, MAP_H);

    // ── Tạo static group cho va chạm ──
    const obstacles = this.physics.add.staticGroup();

    // --- Các vật phẩm trong làng (Tọa độ y được chỉnh để có hiệu ứng depth) ---
    const placeProp = (key, x, y, scale = 1, hitboxW = 0.5, hitboxH = 0.3, offY = 0.3) => {
        const p = obstacles.create(x, y, key).setScale(scale);
        p.setDepth(y); // Càng đứng thấp y càng cao
        const w = p.width * scale * hitboxW;
        const h = p.height * scale * hitboxH;
        p.body.setSize(w, h);
        p.body.setOffset((p.width - w/scale) / 2, p.height - h/scale - (p.height * offY));
        return p;
    };

    // Nhà chính
    placeProp('prop_house', 1400, 800, 0.4);
    // Cối xay gió
    placeProp('prop_windmill', 1250, 650, 0.4);
    // Khu cắm trại
    placeProp('prop_tent', 1700, 750, 0.35);
    placeProp('prop_tent', 1850, 750, 0.35);
    placeProp('prop_campfire', 1775, 780, 0.3);
    // Giếng nước
    placeProp('prop_well', 1750, 650, 0.35);
    // Lâu đài phòng thủ (Tạo thành cổng vào hầm ngục)
    placeProp('prop_castle', 2200, 750, 0.5);
    placeProp('prop_castle', 2200, 1050, 0.5);
    // Đồ đạc khác
    placeProp('prop_chest', 1550, 720, 0.3);
    placeProp('prop_tree_M', 1500, 700, 0.35);

    // Cổng dịch chuyển xuống Dungeon (Nằm giữa 2 lâu đài bên phải)
    const dungeonGate = this.add.image(2200, 900, 'prop_bridge').setScale(0.5).setDepth(900);
    dungeonGate.setTint(0x8844ff); // Chút màu tím hắc ám
    this.physics.add.existing(dungeonGate, true);
    dungeonGate.body.setSize(120, 60);
    
    this.add.text(2200, 850, 'Vào Hầm Ngục', {
        fontSize: '20px', fontFamily: 'Arial', color: '#ffaaaa', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(1000);

    // ── Hàm đặt cây ──
    const placeTree = (key, x, y, scale = 1) => {
        const t = this.add.image(x, y, key).setScale(scale).setDepth(y);
        // Collision box nhỏ ở gốc cây
        const col = this.add.rectangle(x, y + 8, 20, 10, 0x000000, 0);
        this.physics.add.existing(col, true);
        obstacles.add(col);
    };

    // ── Hàm đặt đá ──
    const placeRock = (key, x, y, scale = 1) => {
        const r = this.add.image(x, y, key).setScale(scale).setDepth(y);
        const col = this.add.rectangle(x, y + 4, 28, 16, 0x000000, 0);
        this.physics.add.existing(col, true);
        obstacles.add(col);
    };

    // ══════════════════════════════════════════════
    // THIẾT KẾ MAP: Rừng phía Bắc
    // ══════════════════════════════════════════════
    const northForest = [
        [200,100,'tree1',1.4], [350,150,'tree2',1.2], [500,80,'tree1',1.6],
        [650,130,'tree2',1.3], [800,90,'tree3',1.1], [950,160,'tree1',1.5],
        [1100,120,'tree2',1.4],[1250,70,'tree1',1.2],[1400,150,'tree3',1.3],
        [1600,100,'tree2',1.5],[1750,140,'tree1',1.4],[1900,80,'tree2',1.2],
        [2050,130,'tree3',1.3],[2200,100,'tree1',1.6],[2350,160,'tree2',1.1],
        [2500,90,'tree3',1.4], [2650,140,'tree1',1.5],[2800,110,'tree2',1.3],
        [3000,70,'tree1',1.4], [3100,150,'tree2',1.2],
        // Hàng thứ 2
        [150,220,'tree4',1.0],[400,250,'tree1',1.2],[700,200,'tree2',1.3],
        [1000,240,'tree3',1.1],[1300,220,'tree4',1.0],[1650,260,'tree1',1.3],
        [1950,210,'tree2',1.4],[2250,250,'tree3',1.0],[2550,230,'tree1',1.2],
        [2850,200,'tree2',1.3],[3050,260,'tree4',1.0],
    ];
    northForest.forEach(([x,y,key,s]) => placeTree(key,x,y,s));

    // ══════════════════════════════════════════════
    // Rừng phía Tây
    // ══════════════════════════════════════════════
    const westForest = [
        [80,400,'tree2',1.4],[100,550,'tree1',1.3],[70,700,'tree3',1.5],
        [90,850,'tree2',1.2],[110,1000,'tree1',1.4],[80,1150,'tree3',1.3],
        [100,1300,'tree2',1.5],[200,450,'tree4',1.1],[180,650,'tree1',1.3],
        [220,800,'tree2',1.4],[190,950,'tree3',1.2],[210,1100,'tree1',1.5],
        [180,1250,'tree2',1.3],[240,1400,'tree4',1.1],
    ];
    westForest.forEach(([x,y,key,s]) => placeTree(key,x,y,s));

    // ══════════════════════════════════════════════
    // Rừng phía Đông
    // ══════════════════════════════════════════════
    const eastForest = [
        [3100,400,'tree1',1.4],[3120,550,'tree2',1.3],[3080,700,'tree3',1.5],
        [3110,850,'tree2',1.2],[3090,1000,'tree1',1.4],[3120,1150,'tree3',1.3],
        [3000,480,'tree2',1.3],[2980,650,'tree1',1.5],[3010,820,'tree4',1.1],
        [2990,1000,'tree2',1.4],[3020,1180,'tree1',1.3],
    ];
    eastForest.forEach(([x,y,key,s]) => placeTree(key,x,y,s));

    // ══════════════════════════════════════════════
    // Cánh đồng đá phía Đông (khu nguy hiểm)
    // ══════════════════════════════════════════════
    const eastRocks = [
        [2300,600,'rock1',1.8],[2420,680,'rock2',2.0],[2560,720,'rock3',1.6],
        [2650,800,'rock4',1.9],[2500,880,'rock1',2.1],[2380,960,'rock2',1.7],
        [2700,960,'rock3',2.0],[2580,1050,'rock4',1.8],[2450,1150,'rock1',1.9],
        [2620,1200,'rock2',2.2],[2300,750,'rock3',1.7],[2750,750,'rock4',1.6],
    ];
    eastRocks.forEach(([x,y,key,s]) => placeRock(key,x,y,s));

    // ══════════════════════════════════════════════
    // Đá rải rác ven đường mòn
    // ══════════════════════════════════════════════
    const pathRocks = [
        [600,820,'rock1',1.3],[700,750,'rock2',1.1],[800,870,'rock3',1.2],
        [1000,800,'rock4',1.0],[1200,780,'rock1',1.3],[1450,750,'rock2',1.0],
        [1750,820,'rock3',1.2],[1900,760,'rock4',1.1],[2100,800,'rock1',1.3],
        [400,900,'rock2',1.4],[500,960,'rock3',1.2],[900,950,'rock4',1.1],
        [1050,870,'rock1',1.5],[1750,950,'rock2',1.3],[2000,900,'rock3',1.2],
        // Đá ven rừng bắc
        [450,320,'rock2',1.0],[900,280,'rock4',1.1],[1500,290,'rock1',1.2],
        [2100,310,'rock3',1.0],[2700,300,'rock4',1.1],
    ];
    pathRocks.forEach(([x,y,key,s]) => placeRock(key,x,y,s));

    // ══════════════════════════════════════════════
    // Cây rải rác ở vùng trung tâm
    // ══════════════════════════════════════════════
    const midTrees = [
        [700,650,'tree4',1.0],[750,1000,'tree4',1.1],[2500,650,'tree4',1.0],
        [2450,1000,'tree4',1.1],[1100,600,'tree2',1.2],[2100,600,'tree2',1.2],
        [1100,1250,'tree1',1.3],[2100,1250,'tree1',1.3],
        // Thêm cây trung tâm
        [1350,500,'tree1',1.1],[1850,500,'tree2',1.2],[1200,700,'tree3',1.0],
        [2000,700,'tree1',1.1],[1500,650,'tree2',1.0],[1700,650,'tree3',1.1],
        [800,500,'tree1',1.3],[2400,500,'tree2',1.2],[1000,1100,'tree3',1.1],
        [2200,1100,'tree1',1.2],[1600,1300,'tree2',1.0],[1400,850,'tree3',1.1],
        [1800,850,'tree1',1.0],[600,1200,'tree2',1.2],[2600,1200,'tree1',1.3],
    ];
    midTrees.forEach(([x,y,key,s]) => placeTree(key,x,y,s));

    // ══════════════════════════════════════════════
    // Vùng tối phía Nam – Cây chết + đá
    // ══════════════════════════════════════════════
    const southZone = [
        [300,1350,'tree4',1.4],[500,1450,'tree4',1.3],[700,1350,'tree4',1.5],
        [900,1500,'tree4',1.2],[1100,1380,'tree4',1.4],[1300,1520,'tree4',1.3],
        [1500,1400,'tree4',1.5],[1700,1520,'tree4',1.3],[1900,1380,'tree4',1.4],
        [2100,1500,'tree4',1.3],[2300,1380,'tree4',1.5],[2500,1480,'tree4',1.2],
        [2700,1400,'tree4',1.4],[2900,1500,'tree4',1.3],[3000,1380,'tree4',1.5],
        [600,1600,'rock3',1.6],[1000,1650,'rock1',1.8],[1400,1600,'rock4',1.7],
        [1800,1650,'rock2',1.9],[2200,1600,'rock3',1.6],[2600,1650,'rock4',1.8],
        [3000,1600,'rock1',1.7],
    ];
    southZone.forEach(([x,y,key,s]) => {
        if (key.startsWith('tree')) placeTree(key,x,y,s);
        else placeRock(key,x,y,s);
    });

    // ── Generate Loot Textures ──
    const gfx = this.make.graphics({x: 0, y: 0, add: false});
    gfx.fillStyle(0xffd700, 1).fillCircle(8, 8, 8).lineStyle(2, 0xffaa00).strokeCircle(8, 8, 8);
    gfx.generateTexture('loot_gold', 16, 16);
    gfx.clear();
    gfx.fillStyle(0xff0000, 1).fillRect(4, 4, 8, 12).fillStyle(0xcccccc, 1).fillRect(6, 2, 4, 2);
    gfx.generateTexture('loot_hp_potion', 16, 16);
    gfx.clear();
    gfx.fillStyle(0x0044ff, 1).fillRect(4, 4, 8, 12).fillStyle(0xcccccc, 1).fillRect(6, 2, 4, 2);
    gfx.generateTexture('loot_mp_potion', 16, 16);
    gfx.destroy();

    // ── Animations ──
    // PLAYER (3 Skins, 4 Hướng: Row 0=Down, Row 1=Left, Row 2=Right, Row 3=Up)
    const dirs = ['down', 'left', 'right', 'up'];
    const skinPrefixes = ['p1', 'p2', 'p3'];
    
    skinPrefixes.forEach(p => {
        dirs.forEach((dir, i) => {
            this.anims.create({ key: `${p}_idle_${dir}`,      frames: this.anims.generateFrameNumbers(`${p}_idle`,        { start: i*12, end: i*12+3 }), frameRate: 6,  repeat: -1 });
            this.anims.create({ key: `${p}_walk_${dir}`,      frames: this.anims.generateFrameNumbers(`${p}_walk`,        { start: i*6,  end: i*6+5   }), frameRate: 12, repeat: -1 });
            this.anims.create({ key: `${p}_run_${dir}`,       frames: this.anims.generateFrameNumbers(`${p}_run`,         { start: i*8,  end: i*8+7   }), frameRate: 14, repeat: -1 });
            this.anims.create({ key: `${p}_attack_1_${dir}`,  frames: this.anims.generateFrameNumbers(`${p}_attack`,      { start: i*8,  end: i*8+7   }), frameRate: 15, repeat: 0  });
            this.anims.create({ key: `${p}_attack_2_${dir}`,  frames: this.anims.generateFrameNumbers(`${p}_walk_attack`, { start: i*6,  end: i*6+5   }), frameRate: 15, repeat: 0  });
            this.anims.create({ key: `${p}_attack_3_${dir}`,  frames: this.anims.generateFrameNumbers(`${p}_run_attack`,  { start: i*8,  end: i*8+7   }), frameRate: 15, repeat: 0  });
        });
        // Hurt & Death (Dùng row 0)
        this.anims.create({ key: `${p}_hurt`,  frames: this.anims.generateFrameNumbers(`${p}_hurt`,  { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: `${p}_death`, frames: this.anims.generateFrameNumbers(`${p}_death`, { start: 0, end: 5 }), frameRate: 8,  repeat: 0 });
    });

    // ENEMY (Row 0 only)
    this.anims.create({ key: 'enemy_idle',   frames: this.anims.generateFrameNumbers('enemy_idle',   { start: 0, end: 3 }), frameRate: 8,  repeat: -1 });
    this.anims.create({ key: 'enemy_walk',   frames: this.anims.generateFrameNumbers('enemy_walk',   { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'enemy_run',    frames: this.anims.generateFrameNumbers('enemy_run',    { start: 0, end: 4 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'enemy_attack', frames: this.anims.generateFrameNumbers('enemy_attack', { start: 0, end: 4 }), frameRate: 12, repeat: 0  });
    this.anims.create({ key: 'enemy_hurt',   frames: this.anims.generateFrameNumbers('enemy_hurt',   { start: 0, end: 3 }), frameRate: 10, repeat: 0  });
    this.anims.create({ key: 'enemy_death',  frames: this.anims.generateFrameNumbers('enemy_death',  { start: 0, end: 5 }), frameRate: 8,  repeat: 0  });

    // ── Camera ──
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    

    // ── Player ──
    let savedLevel = 1;
    let savedExp = 0;
    try {
        const savedData = localStorage.getItem('calamity_save');
        if (savedData) {
            const data = JSON.parse(savedData);
            savedLevel = data.level || 1;
            savedExp = data.exp || 0;
        }
    } catch(e) {}

    player = new Player(this, 1600, 900, savedLevel, savedExp);
    this.player = player;
    player.setDepth(player.y);

    // ── Input ──
    cursors   = this.input.keyboard.createCursorKeys();
    wasd      = this.input.keyboard.addKeys('W,A,S,D');
    spaceBar  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    skillKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E); // Tornado
    skillKey2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q); // Dash slash

    // ── Enemy Group ──
    enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.enemies = enemies;

    // ── Loots Group ──
    this.loots = this.physics.add.group();
    this.physics.add.overlap(player, this.loots, (p, loot) => {
        if (loot.active && loot.collect) loot.collect(p);
    });

    // Spawn quái tại các vị trí cố định
    ENEMY_SPAWNS.forEach(({ x, y }) => {
        const e = enemies.get(x, y);
        if (e) {
            e.spawnX = x; e.spawnY = y; // lưu vị trí spawn để respawn
            e.setActive(true).setVisible(true);
            if (e.body) e.body.setAllowGravity(false);
        }
    });

    // ── Cấu hình Camera Follow ──
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // ── Va chạm ──
    // Player vs obstacles
    this.physics.add.collider(player, obstacles);
    // Enemy vs obstacles
    this.physics.add.collider(enemies, obstacles);

    // Player attack hitbox vs enemies
    this.physics.add.overlap(player.attackHitbox, enemies, (hitbox, enemy) => {
        if (hitbox.body.enable && enemy.active && enemy.hp > 0 && !player.hitEnemies.has(enemy)) {
            enemy.takeDamage(player.damage);
            player.hitEnemies.add(enemy);
        }
    }, null, this);

    // ── Projectiles Group ──
    this.projectiles = this.physics.add.group();
    this.physics.add.overlap(this.projectiles, enemies, (proj, enemy) => {
        if (proj.active && enemy.active && enemy.hp > 0) {
            enemy.takeDamage(proj.damage || 20);
            proj.destroy(); // Biến mất khi trúng quái
        }
    }, null, this);

    // ── Chuyển map (Dungeon) ──
    this.physics.add.overlap(player, dungeonGate, () => {
        // Lưu máu và level
        player.saveProgress();
        this.scene.start('DungeonScene');
    }, null, this);

    // === Admin Panel ===
    new AdminPanel(this, player);
}

update(time, delta) {
    if (player && player.active) {
        player.update(cursors, wasd, time, spaceBar, skillKey, skillKey2);
        player.setDepth(player.y);
    }
    enemies.children.each((enemy) => {
        if (enemy.active) {
            enemy.update(player, time);
            enemy.setDepth(enemy.y);
        }
    });
}
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#1a2a1a',
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [MainScene, DungeonScene]
};

new Phaser.Game(config);