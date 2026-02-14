/**
 * 탕탕포켓몬 - 콤보/웨이브/배경테마/최고기록 대규모 업데이트
 * @author Gora-pa-duck (Senior Developer)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const mCtx = minimapCanvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameOverScreen = document.getElementById('game-over-screen');
const levelUpModal = document.getElementById('level-up-modal');
const expBar = document.getElementById('exp-bar');
const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer-display');
const killDisplay = document.getElementById('score-display');
const skillOptionsContainer = document.getElementById('skill-options');
const squirtleSlot = document.getElementById('squirtle-status-slot');
const squirtleIcon = document.getElementById('squirtle-ui-icon');
const squirtleText = document.getElementById('squirtle-ready-text');

// --- 전역 변수 ---
let gameState = 'START';
let score = 0;
let level = 1;
let exp = 0;
let expToNextLevel = 80;
let gameTime = 0;
let lastTime = null;
let keys = {};
let player = null;
let enemies = [];
let projectiles = [];
let items = [];
let particles = [];
let floatingTexts = [];
let screenShake = 0;
let lastBossLevel = 0;
let bgOffsetX = 0;
let bgOffsetY = 0;
let lastEventTime = 0;
let expMultiplier = 1;
let expMultiplierTimer = 0;

// ===== 신규: 콤보 시스템 =====
let combo = 0;
let comboTimer = 0;
let maxCombo = 0;
let comboDisplay = '';

// ===== 꼬부기 서포터 =====
let squirtle = null;
let squirtleCooldown = 0;
const SQUIRTLE_IMG = new Image();
SQUIRTLE_IMG.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png';

// ===== 웨이브 카운트다운 =====
let waveCountdown = 0;
let wavePending = null;

// ===== 신규: 이벤트 웨이브 =====
let waveActive = false;
let waveTimer = 0;
let waveType = '';
let lastWaveTime = 0;

// ===== 신규: 최고 기록 =====
let highScore = parseInt(localStorage.getItem('tangtang_highscore') || '0');
let highLevel = parseInt(localStorage.getItem('tangtang_highlevel') || '0');
let highCombo = parseInt(localStorage.getItem('tangtang_highcombo') || '0');

const CONFIG = { BASE_PLAYER_SPEED: 3.5, MINIMAP_SIZE: 100, MINIMAP_RANGE: 1500 };

// --- 이미지 ---
const PIKACHU_IMG = new Image();
PIKACHU_IMG.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
function loadImg(id) { const img = new Image(); img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`; return img; }

// ===== 단계별 배경 테마 =====
const STAGE_THEMES = [
    { name: '초원', bg: '#3e8948', dot1: '#4da85a', dot2: '#34723c', maxLv: 10 },
    { name: '동굴', bg: '#4a4a5a', dot1: '#555568', dot2: '#3a3a48', maxLv: 20 },
    { name: '숲속', bg: '#2d5a27', dot1: '#3a7030', dot2: '#1f4a1a', maxLv: 30 },
    { name: '바다', bg: '#1a5276', dot1: '#206694', dot2: '#154360', maxLv: 40 },
    { name: '화산', bg: '#6b2020', dot1: '#8a3030', dot2: '#551515', maxLv: 50 },
];
function getCurrentTheme() {
    for (const t of STAGE_THEMES) { if (level <= t.maxLv) return t; }
    return STAGE_THEMES[STAGE_THEMES.length - 1];
}
function applyTheme() {
    const t = getCurrentTheme();
    const gc = document.getElementById('game-container');
    gc.style.backgroundColor = t.bg;
    gc.style.backgroundImage = `radial-gradient(${t.dot1} 10%, transparent 10%), radial-gradient(${t.dot2} 10%, transparent 10%)`;
}

// ===== 적 포켓몬 도감 (30종) =====
const ENEMY_DB = {
    CATERPIE: { id: 10, name: '캐터피', hpMul: 0.8, spdMul: 0.7, radius: 12, tier: 1 },
    RATTATA: { id: 19, name: '꼬렛', hpMul: 1.0, spdMul: 1.0, radius: 14, tier: 1 },
    PIDGEY: { id: 16, name: '구구', hpMul: 1.0, spdMul: 0.9, radius: 14, tier: 1 },
    WEEDLE: { id: 13, name: '뿔충이', hpMul: 0.9, spdMul: 0.8, radius: 12, tier: 2 },
    EKANS: { id: 23, name: '아보', hpMul: 1.5, spdMul: 0.9, radius: 15, tier: 2 },
    ZUBAT: { id: 41, name: '주뱃', hpMul: 1.2, spdMul: 1.1, radius: 14, tier: 2 },
    GEODUDE: { id: 74, name: '꼬마돌', hpMul: 4.0, spdMul: 0.4, radius: 18, tier: 3 },
    PARAS: { id: 46, name: '파라스', hpMul: 2.0, spdMul: 0.6, radius: 14, tier: 3 },
    SANDSHREW: { id: 27, name: '모래두지', hpMul: 2.5, spdMul: 0.7, radius: 15, tier: 3 },
    GOLBAT: { id: 42, name: '골뱃', hpMul: 2.0, spdMul: 1.1, radius: 18, tier: 4 },
    ARBOK: { id: 24, name: '아보크', hpMul: 3.0, spdMul: 0.8, radius: 20, tier: 4 },
    ODDISH: { id: 43, name: '뚜벅쵸', hpMul: 1.8, spdMul: 0.6, radius: 14, tier: 4 },
    HAUNTER: { id: 93, name: '고우스트', hpMul: 2.5, spdMul: 1.0, radius: 18, tier: 5 },
    GRAVELER: { id: 75, name: '데구리', hpMul: 6.0, spdMul: 0.35, radius: 22, tier: 5 },
    GRIMER: { id: 88, name: '질퍽이', hpMul: 3.5, spdMul: 0.5, radius: 18, tier: 5 },
    TENTACOOL: { id: 72, name: '왕눈해', hpMul: 2.0, spdMul: 0.9, radius: 16, tier: 6 },
    KOFFING: { id: 109, name: '또가스', hpMul: 3.0, spdMul: 0.7, radius: 18, tier: 6 },
    MAGNEMITE: { id: 81, name: '코일', hpMul: 2.5, spdMul: 0.8, radius: 14, tier: 6 },
    MUK: { id: 89, name: '질뻐기', hpMul: 5.0, spdMul: 0.4, radius: 24, tier: 7 },
    MAGNETON: { id: 82, name: '레어코일', hpMul: 3.5, spdMul: 0.85, radius: 18, tier: 7 },
    WEEZING: { id: 110, name: '또도가스', hpMul: 4.0, spdMul: 0.6, radius: 22, tier: 7 },
    GENGAR: { id: 94, name: '팬텀', hpMul: 3.0, spdMul: 1.0, radius: 20, tier: 8 },
    GOLEM: { id: 76, name: '딱구리', hpMul: 8.0, spdMul: 0.3, radius: 26, tier: 8 },
    TENTACRUEL: { id: 73, name: '독파리', hpMul: 4.0, spdMul: 0.75, radius: 22, tier: 8 },
    MACHAMP: { id: 68, name: '괴력몬', hpMul: 5.0, spdMul: 0.7, radius: 24, tier: 9 },
    ALAKAZAM: { id: 65, name: '후딘', hpMul: 2.5, spdMul: 1.05, radius: 18, tier: 9 },
    RHYDON: { id: 112, name: '코뿌리', hpMul: 9.0, spdMul: 0.3, radius: 28, tier: 9 },
    DRAGONITE: { id: 149, name: '망나뇽', hpMul: 6.0, spdMul: 0.9, radius: 26, tier: 10 },
    TYRANITAR: { id: 248, name: '마기라스', hpMul: 8.0, spdMul: 0.5, radius: 28, tier: 10 },
    SALAMENCE: { id: 373, name: '보만다', hpMul: 5.0, spdMul: 0.95, radius: 26, tier: 10 },
};
Object.values(ENEMY_DB).forEach(e => { e.img = loadImg(e.id); });

const BOSS_DB = [
    { lvl: 5, id: 143, name: '잠만보', hpMul: 1 },
    { lvl: 10, id: 76, name: '딱구리', hpMul: 1.5 },
    { lvl: 15, id: 94, name: '팬텀', hpMul: 2 },
    { lvl: 20, id: 130, name: '갸라도스', hpMul: 2.5 },
    { lvl: 25, id: 248, name: '마기라스', hpMul: 3 },
    { lvl: 30, id: 149, name: '망나뇽', hpMul: 3.5 },
    { lvl: 35, id: 150, name: '뮤츠', hpMul: 4 },
    { lvl: 40, id: 384, name: '레쿠쟈', hpMul: 5 },
    { lvl: 45, id: 483, name: '디아루가', hpMul: 6 },
    { lvl: 50, id: 249, name: '루기아', hpMul: 8 },
];
BOSS_DB.forEach(b => { b.img = loadImg(b.id); });

function getEnemyPool() { return Object.values(ENEMY_DB).filter(e => e.tier <= Math.min(10, Math.ceil(level / 5))); }
function getSpawnRate() { return Math.max(350, 1800 - level * 25); }
function getBaseEnemyHp() { return 1 + Math.floor(level * 0.6); }
function getBaseEnemySpeed() { return 0.6 + Math.min(level * 0.015, 0.8); }

const ITEM_TYPES = {
    GEM: { color: '#00ffcc', icon: '💎', name: '경험치 보석' },
    MAGNET: { color: '#ff44ff', icon: '🧲', name: '자석' },
    BOX: { color: '#ffcb05', icon: '🎁', name: '보물 상자' },
    HEAL: { color: '#ff4d4d', icon: '🍎', name: '체력 회복' },
    EXPUP: { color: '#d4fc79', icon: '⭐', name: '경험치 2배' },
    SHIELD: { color: '#54a0ff', icon: '🛡️', name: '무적' },
};

const WEAPON_TYPES = {
    THUNDER: { id: 'THUNDER', name: '10만볼트', desc: '전기 구체를 발사! 가까운 적 자동 조준', icon: '⚡', color: '#fffc00', type: 'WEAPON' },
    MISSILE: { id: 'MISSILE', name: '코일 미사일', desc: '적을 따라가는 유도 미사일!', icon: '🚀', color: '#a5a5a5', type: 'WEAPON' },
    LEAF: { id: 'LEAF', name: '잎날갈기', desc: '주변을 회전하며 적을 썰어버림!', icon: '🍃', color: '#44ff44', type: 'WEAPON' },
    WIND: { id: 'WIND', name: '에어슬래시', desc: '초승달 바람 칼날이 관통!', icon: '🌪️', color: '#aaf0ff', type: 'WEAPON' },
    FIRE: { id: 'FIRE', name: '불꽃세례', desc: '불꽃 흔적을 남기는 화염구!', icon: '🔥', color: '#ff9f43', type: 'WEAPON' },
    BOMB: { id: 'BOMB', name: '폭탄몬스터볼', desc: '느리지만 닿으면 큰 폭발!', icon: '💣', color: '#ee5253', type: 'WEAPON' },
    POW: { id: 'POW', name: '힘의머리띠', desc: '공격력 20% 증가', icon: '🥊', type: 'PASSIVE' },
    SPD: { id: 'SPD', name: '실크스카프', desc: '이동 속도 15% 증가', icon: '👞', type: 'PASSIVE' },
    MAG: { id: 'MAG', name: '자석', desc: '아이템 흡수 범위 증가', icon: '🧲', type: 'PASSIVE' },
};

// ========================================
// 클래스
// ========================================
class Entity {
    constructor(x, y, radius, img) { this.x = x; this.y = y; this.radius = radius; this.img = img; this.angle = 0; this.invincible = 0; this.destroyed = false; }
}

class FloatingText {
    constructor(x, y, text, color, big = false) { this.x = x; this.y = y; this.text = text; this.color = color; this.life = big ? 90 : 50; this.maxLife = this.life; this.big = big; this.scale = big ? 1.5 : 1; }
    update() { this.y -= 1.2; this.life--; if (this.big && this.scale > 1) this.scale -= 0.02; }
    draw() {
        const alpha = Math.min(1, this.life / (this.maxLife * 0.5));
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.floor((this.big ? 20 : 13) * this.scale)}px sans-serif`;
        ctx.fillStyle = this.color; ctx.strokeStyle = 'black'; ctx.lineWidth = this.big ? 4 : 3; ctx.textAlign = 'center';
        ctx.strokeText(this.text, this.x, this.y); ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Weapon {
    constructor(type) { this.type = type; this.level = 1; this.timer = 0; this.interval = { THUNDER: 900, MISSILE: 1800, WIND: 1400, FIRE: 1500, BOMB: 2800 }[type.id] || 0; this.leafAngle = 0; }
    update(dt, pl, en) { if (this.type.id === 'LEAF') { this.leafAngle += 0.035 + this.level * 0.004; return; } this.timer += dt * 1000; if (this.timer >= this.interval) { this.fire(pl, en); this.timer = 0; } }
    fire(pl, en) {
        if (en.length === 0) return;
        if (en.length === 0) return;
        // 공격력 계산: 합연산(1 + N*0.2) -> 곱연산(1.2^N)으로 변경! (복리로 20%씩 강해짐)
        const powLevel = pl.passives.POW || 0;
        const dmg = Math.pow(1.2, powLevel);
        let near = null, minD = Infinity;
        en.forEach(e => { if (!e.destroyed) { const d = Math.hypot(e.x - pl.x, e.y - pl.y); if (d < minD) { minD = d; near = e; } } });
        const a = near ? Math.atan2(near.y - pl.y, near.x - pl.x) : Math.random() * Math.PI * 2;
        const lv = this.level;
        switch (this.type.id) {
            case 'THUNDER': { const c = Math.min(lv, 3); for (let i = 0; i < c; i++) projectiles.push(new Projectile(pl.x, pl.y, a + (i - (c - 1) / 2) * 0.12, '#fffc00', 5.5, 1 * dmg, false, false, false, 0, 'THUNDER')); break; }
            case 'MISSILE': { const c = 1 + Math.floor(lv / 2); for (let i = 0; i < c; i++) projectiles.push(new Projectile(pl.x, pl.y, a + (Math.random() - 0.5) * 0.5, '#aaa', 3.5, 1.5 * dmg, true, false, false, 0, 'MISSILE')); break; }
            case 'WIND': { const c = Math.min(lv, 4); for (let i = 0; i < c; i++) projectiles.push(new Projectile(pl.x, pl.y, a + (i - (c - 1) / 2) * 0.18, '#aaf0ff', 6, 1.2 * dmg, false, true, false, 0, 'WIND')); break; }
            case 'FIRE': { projectiles.push(new Projectile(pl.x, pl.y, a + (Math.random() - 0.5) * 0.2, '#ff9f43', 4.5, 2.5 * dmg, false, false, true, 0, 'FIRE')); break; }
            case 'BOMB': { projectiles.push(new Projectile(pl.x, pl.y, a, '#ee5253', 2, 5 * dmg, false, false, false, 130 + lv * 15, 'BOMB')); break; }
        }
    }
}

class Player extends Entity {
    constructor(x, y) { super(x, y, 16, PIKACHU_IMG); this.maxHp = 3; this.hp = 3; this.weapons = [new Weapon(WEAPON_TYPES.THUNDER)]; this.passives = {}; }
    update(dt) {
        const spd = CONFIG.BASE_PLAYER_SPEED * (1 + (this.passives.SPD || 0) * 0.15);
        let dx = 0, dy = 0;
        if (keys['ArrowUp'] || keys['w']) dy -= spd; if (keys['ArrowDown'] || keys['s']) dy += spd;
        if (keys['ArrowLeft'] || keys['a']) dx -= spd; if (keys['ArrowRight'] || keys['d']) dx += spd;
        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
        this.x += dx; this.y += dy;
        if (dx !== 0 || dy !== 0) { this.angle = Math.atan2(dy, dx); bgOffsetX -= dx * 0.5; bgOffsetY -= dy * 0.5; document.getElementById('game-container').style.backgroundPosition = `${bgOffsetX}px ${bgOffsetY}px`; }
        if (this.invincible > 0) this.invincible--;
        this.weapons.forEach(w => w.update(dt, this, enemies));
    }
}

class Enemy extends Entity {
    constructor(isBoss = false, bossData = null) {
        const angle = Math.random() * Math.PI * 2, dist = 550 + Math.random() * 100;
        const x = player.x + Math.cos(angle) * dist, y = player.y + Math.sin(angle) * dist;
        if (isBoss && bossData) {
            super(x, y, 50, bossData.img); this.isBoss = true; this.bossName = bossData.name;
            this.maxHp = Math.floor(150 * bossData.hpMul); this.hp = this.maxHp;
            this.speed = Math.min(0.6 + level * 0.01, 2.0); this.hitFlash = 0;
        } else {
            const pool = getEnemyPool(), spec = pool[Math.floor(Math.random() * pool.length)];
            super(x, y, spec.radius, spec.img); this.isBoss = false; this.specName = spec.name;
            this.maxHp = Math.ceil(getBaseEnemyHp() * spec.hpMul); this.hp = this.maxHp;
            this.speed = Math.min(getBaseEnemySpeed() * spec.spdMul, 2.8); this.hitFlash = 0;
        }
    }
    update() { const a = Math.atan2(player.y - this.y, player.x - this.x); this.x += Math.cos(a) * this.speed; this.y += Math.sin(a) * this.speed; this.angle = a; if (this.hitFlash > 0) this.hitFlash--; }
    takeDamage(d) { if (this.destroyed) return; this.hp -= d; this.hitFlash = 5; if (this.hp <= 0) this.die(); }
    die() {
        if (this.destroyed) return; this.destroyed = true; score++;
        // ===== 콤보 시스템 =====
        combo++; comboTimer = 4.0; // 4초 안에 다음 킬 안 하면 콤보 리셋
        if (combo > maxCombo) maxCombo = combo;
        // 콤보 피드백
        if (combo >= 5 && combo % 5 === 0) {
            const comboColors = ['#fffc00', '#ff9f43', '#ee5253', '#ff44ff', '#54a0ff'];
            const ci = Math.min(Math.floor(combo / 5) - 1, comboColors.length - 1);
            floatingTexts.push(new FloatingText(player.x, player.y - 60, `🔥 ${combo} COMBO!`, comboColors[ci], true));
            screenShake = Math.min(combo, 30);
            // 콤보 보너스: 10콤보마다 경험치 보너스
            if (combo % 10 === 0) {
                for (let i = 0; i < 5; i++) items.push(new Item(this.x + (Math.random() - 0.5) * 80, this.y + (Math.random() - 0.5) * 80, 'GEM'));
                floatingTexts.push(new FloatingText(player.x, player.y - 90, `⭐ 콤보 보너스!`, '#d4fc79', true));
            }
        }

        screenShake = Math.max(screenShake, this.isBoss ? 50 : 4);
        // 처치 이펙트 강화
        const pCount = this.isBoss ? 15 : 6;
        const pColors = this.isBoss ? ['#ff4444', '#ffcb05', '#ff9f43'] : ['#ff4444', '#ff8888', '#ffaaaa'];
        for (let i = 0; i < pCount; i++) particles.push(new Particle(this.x + (Math.random() - 0.5) * 20, this.y + (Math.random() - 0.5) * 20, pColors[i % pColors.length], this.isBoss ? 2.5 : 1.5));

        if (this.isBoss) {
            // 보스 처치 시 대량의 오브젝트 생성으로 인한 렉 방지 (25개 -> 5개로 압축, 가치는 5배)
            for (let i = 0; i < 5; i++) items.push(new Item(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, 'GEM', 5));
            items.push(new Item(this.x, this.y, 'BOX'));
            floatingTexts.push(new FloatingText(this.x, this.y - 30, `🏆 ${this.bossName} 처치!`, '#ffcb05', true));
        } else {
            const roll = Math.random();
            if (roll < 0.02) items.push(new Item(this.x, this.y, 'HEAL'));
            else if (roll < 0.03) items.push(new Item(this.x, this.y, 'EXPUP'));
            else if (roll < 0.04) items.push(new Item(this.x, this.y, 'SHIELD'));
            else if (roll < 0.055) items.push(new Item(this.x, this.y, 'MAGNET'));
            else items.push(new Item(this.x, this.y, 'GEM'));
        }
    }
}

class Projectile extends Entity {
    constructor(x, y, angle, color, speed, damage, homing = false, piercing = false, fire = false, blast = 0, wType = '') {
        super(x, y, 5, null); this.angle = angle; this.color = color; this.speed = speed; this.damage = damage;
        this.homing = homing; this.piercing = piercing; this.fire = fire; this.blast = blast;
        this.wType = wType; this.pierced = new Set(); this.life = 160; this.age = 0;
    }
    update() {
        if (this.destroyed) return; this.age++;
        if (this.homing) { let n = null, m = Infinity; enemies.forEach(e => { if (!e.destroyed) { const d = Math.hypot(e.x - this.x, e.y - this.y); if (d < m) { m = d; n = e; } } }); if (n) { const tA = Math.atan2(n.y - this.y, n.x - this.x); let di = tA - this.angle; while (di < -Math.PI) di += Math.PI * 2; while (di > Math.PI) di -= Math.PI * 2; this.angle += di * 0.12; } }
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        if (this.fire && this.age % 2 === 0) { particles.push(new Particle(this.x + (Math.random() - 0.5) * 6, this.y + (Math.random() - 0.5) * 6, '#ff9f43', 0.5)); particles.push(new Particle(this.x, this.y, '#ff6b6b', 0.3)); }
        if (this.wType === 'THUNDER' && this.age % 3 === 0) particles.push(new Particle(this.x + (Math.random() - 0.5) * 8, this.y + (Math.random() - 0.5) * 8, '#fffc00', 0.3));
        if (this.wType === 'MISSILE' && this.age % 4 === 0) particles.push(new Particle(this.x, this.y, '#888', 0.2));
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i]; if (e.destroyed) continue; const hd = this.wType === 'WIND' ? this.radius + e.radius + 8 : this.radius + e.radius; if (Math.hypot(this.x - e.x, this.y - e.y) > hd) continue;
            if (this.blast > 0) { for (let j = 0; j < 25; j++)particles.push(new Particle(this.x + (Math.random() - 0.5) * this.blast, this.y + (Math.random() - 0.5) * this.blast, j % 2 === 0 ? '#ee5253' : '#ff9f43', 2)); enemies.forEach(en => { if (!en.destroyed && Math.hypot(this.x - en.x, this.y - en.y) < this.blast) en.takeDamage(this.damage); }); screenShake = Math.max(screenShake, 20); this.destroyed = true; break; }
            if (this.piercing) { if (!this.pierced.has(e)) { e.takeDamage(this.damage); this.pierced.add(e); } } else { e.takeDamage(this.damage); this.destroyed = true; break; }
        }
        this.life--; if (this.life <= 0) this.destroyed = true;
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        // 성능 최적화: 그림자 제거 (크롬북 등 저사양 기기 렉 방지)
        // ctx.shadowBlur = ... 제거
        switch (this.wType) {
            case 'THUNDER': ctx.fillStyle = '#fffc00'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); break;
            case 'MISSILE': ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ee5253'; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-10, 0); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill(); break;
            case 'WIND': ctx.strokeStyle = '#aaf0ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 20, -Math.PI * 0.35, Math.PI * 0.35); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 15, -Math.PI * 0.25, Math.PI * 0.25); ctx.stroke(); break;
            case 'FIRE': ctx.fillStyle = '#ff9f43'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); break;
            case 'BOMB': { const r = 13; ctx.fillStyle = '#ee5253'; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#333'; ctx.fillRect(-r, -1.5, r * 2, 3); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); break; }
            case 'WATER': ctx.fillStyle = '#54a0ff'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#aaddff'; ctx.beginPath(); ctx.arc(-2, -2, 2, 0, Math.PI * 2); ctx.fill(); break;
            default: ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

class Item {
    constructor(x, y, type, value = 1) { this.x = x; this.y = y; this.type = type; this.value = value; this.radius = (value > 1) ? 12 : 8; this.bob = Math.random() * Math.PI * 2; }
    draw() { this.bob += 0.05; ctx.save(); ctx.translate(this.x, this.y + Math.sin(this.bob) * 3); ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fillStyle = ITEM_TYPES[this.type].color; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); if (this.type !== 'GEM') { ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ITEM_TYPES[this.type].icon, 0, 0); } ctx.restore(); }
}

class Particle {
    constructor(x, y, c, s = 1) { this.x = x; this.y = y; this.c = c; this.vx = (Math.random() - 0.5) * 8 * s; this.vy = (Math.random() - 0.5) * 8 * s; this.a = 1; this.sz = 2 + Math.random() * 3 * s; }
    update() { this.x += this.vx; this.y += this.vy; this.a -= 0.03; this.vx *= 0.97; this.vy *= 0.97; }
    draw() { ctx.save(); ctx.globalAlpha = this.a; ctx.fillStyle = this.c; ctx.beginPath(); ctx.arc(this.x, this.y, this.sz, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}

// --- 함수 ---
function showToast(msg) { eventToast.innerText = msg; eventToast.classList.remove('hidden'); setTimeout(() => eventToast.classList.add('hidden'), 2500); }

function saveHighScores() {
    if (score > highScore) { highScore = score; localStorage.setItem('tangtang_highscore', highScore); }
    if (level > highLevel) { highLevel = level; localStorage.setItem('tangtang_highlevel', highLevel); }
    if (maxCombo > highCombo) { highCombo = maxCombo; localStorage.setItem('tangtang_highcombo', highCombo); }
}

function updateUI() {
    expBar.style.width = (exp / expToNextLevel * 100) + '%'; levelDisplay.innerText = `LV.${level}`;
    killDisplay.innerText = `KILLS: ${score}`;
    let m = Math.floor(gameTime / 60), s = Math.floor(gameTime % 60);
    timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const sk = document.getElementById('skill-icons'); sk.innerHTML = '';
    player.weapons.forEach(w => { const d = document.createElement('div'); d.className = 'skill-slot'; d.innerHTML = `${w.type.icon}<small>${w.level}</small>`; sk.appendChild(d); });
    Object.entries(player.passives).forEach(([id, l]) => { const o = WEAPON_TYPES[id]; const d = document.createElement('div'); d.className = 'skill-slot passive'; d.innerHTML = `${o.icon}<small>${l}</small>`; sk.appendChild(d); });
    const hc = document.getElementById('heart-container'); hc.innerHTML = '';
    for (let i = 0; i < player.maxHp; i++) { const h = document.createElement('span'); h.innerText = i < player.hp ? '❤️' : '🖤'; hc.appendChild(h); }

    // 꼬부기 UI 업데이트
    if (squirtle) {
        squirtleIcon.style.filter = 'none';
        squirtleText.innerText = 'ACTIVE';
        squirtleText.style.color = '#54a0ff';
        squirtleSlot.style.borderColor = '#54a0ff';
    } else if (squirtleCooldown > 0) {
        squirtleIcon.style.filter = 'grayscale(100%)';
        squirtleText.innerText = `${Math.ceil(squirtleCooldown)}s`;
        squirtleText.style.color = '#ccc';
        squirtleSlot.style.borderColor = '#555';
    } else {
        squirtleIcon.style.filter = 'none';
        squirtleText.innerText = 'SPACE';
        // 깜빡임 효과
        squirtleText.style.color = Math.floor(Date.now() / 500) % 2 === 0 ? '#54a0ff' : '#fff';
        squirtleSlot.style.borderColor = '#54a0ff';
    }
}

function handleLevelUp() {
    gameState = 'LEVEL_UP'; levelUpModal.classList.remove('hidden'); skillOptionsContainer.innerHTML = '';
    applyTheme(); // 레벨업 시 테마 체크
    if (level <= 50) { const bossInfo = BOSS_DB.find(b => b.lvl === level); if (bossInfo) showToast(`🚨 Lv.${level} 보스 ${bossInfo.name} 등장 예정!`); }
    const pool = Object.values(WEAPON_TYPES); const options = []; while (options.length < 3) { const r = pool[Math.floor(Math.random() * pool.length)]; if (!options.includes(r)) options.push(r); }
    options.forEach(o => {
        const ex = o.type === 'WEAPON' ? player.weapons.find(w => w.type.id === o.id) : player.passives[o.id];
        const div = document.createElement('div'); div.className = 'skill-card';
        div.innerHTML = `<div class="skill-icon">${o.icon}</div><div class="skill-info"><div class="skill-name">${o.name}${ex ? ' Lv.' + ((o.type === 'WEAPON' ? ex.level : ex) + 1) : ' NEW'}</div><div class="skill-desc">${o.desc}</div></div>`;
        div.onclick = () => { if (o.type === 'WEAPON') { if (!ex) { if (player.weapons.length < 6) player.weapons.push(new Weapon(o)); } else ex.level++; } else player.passives[o.id] = (player.passives[o.id] || 0) + 1; gameState = 'PLAYING'; levelUpModal.classList.add('hidden'); lastTime = null; animate(); };
        skillOptionsContainer.appendChild(div);
    });
}

function spawnEnemy() {
    if (gameState !== 'PLAYING') { setTimeout(spawnEnemy, 1000); return; }
    const bossInfo = BOSS_DB.find(b => b.lvl === level);
    if (bossInfo && lastBossLevel < level) { enemies.push(new Enemy(true, bossInfo)); lastBossLevel = level; showToast(`🚨 ${bossInfo.name} 출현! 🚨`); }
    else enemies.push(new Enemy());
    // 웨이브 중이면 빠르게 스폰
    const rate = waveActive && waveType === 'RUSH' ? Math.floor(getSpawnRate() * 0.3) : getSpawnRate();
    setTimeout(spawnEnemy, rate);
}

// ===== 이벤트 웨이브 시스템 (카운트다운 포함) =====
function startWaveCountdown(forcedType = null) {
    const waves = [
        { type: 'RUSH', name: '🌊 몬스터 러시!', desc: '20초간 몬스터 폭주!', duration: 20 },
        { type: 'GOLDEN', name: '✨ 골든 타임!', desc: '15초간 경험치 3배!', duration: 15 },
        { type: 'SURVIVAL', name: '💀 서바이벌!', desc: '10초간 생존하면 레벨업!', duration: 10 },
    ];
    // 지정된 타입이 있으면 그것으로, 없으면 랜덤 (비상용)
    if (forcedType) {
        wavePending = waves.find(w => w.type === forcedType);
    } else {
        wavePending = waves[Math.floor(Math.random() * waves.length)];
    }
    waveCountdown = 3.0;
    showToast(`⚠️ ${wavePending.name} 3초 후 시작!`);
}
function triggerWave() {
    const wave = wavePending; wavePending = null;
    waveActive = true; waveTimer = wave.duration; waveType = wave.type;
    showToast(`${wave.name} ${wave.desc}`);
    if (wave.type === 'GOLDEN') expMultiplier = 3;

    // 러시: 스폰량 폭발! (기존 20 -> 40마리 즉시 스폰)
    if (wave.type === 'RUSH') {
        for (let i = 0; i < 40; i++) { enemies.push(new Enemy()); }
        screenShake = 20;
    }
    if (wave.type === 'SURVIVAL') { screenShake = 10; }
}
function endWave() {
    if (waveType === 'GOLDEN') { expMultiplier = (expMultiplierTimer > 0) ? 2 : 1; }
    if (waveType === 'SURVIVAL') { level++; exp = 0; expToNextLevel = Math.floor(80 + level * 15); floatingTexts.push(new FloatingText(player.x, player.y - 60, '🏆 서바이벌 클리어!', '#ffcb05', true)); handleLevelUp(); }
    if (waveType === 'RUSH') { floatingTexts.push(new FloatingText(player.x, player.y - 60, '🌊 러시 종료! 수고했다!', '#ee5253', true)); }
    waveActive = false; waveType = '';
}

function drawMinimap() {
    mCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    const sc = CONFIG.MINIMAP_SIZE / CONFIG.MINIMAP_RANGE, ct = CONFIG.MINIMAP_SIZE / 2;
    mCtx.fillStyle = '#ffcb05'; mCtx.beginPath(); mCtx.arc(ct, ct, 3, 0, Math.PI * 2); mCtx.fill();
    items.forEach(it => { const dx = (it.x - player.x) * sc, dy = (it.y - player.y) * sc; if (Math.abs(dx) < ct && Math.abs(dy) < ct) { mCtx.fillStyle = ITEM_TYPES[it.type].color; mCtx.beginPath(); mCtx.arc(ct + dx, ct + dy, 2, 0, Math.PI * 2); mCtx.fill(); } });
    enemies.forEach(e => { if (e.isBoss && !e.destroyed) { const dx = (e.x - player.x) * sc, dy = (e.y - player.y) * sc; if (Math.abs(dx) < ct && Math.abs(dy) < ct) { mCtx.fillStyle = '#ff1f1f'; mCtx.beginPath(); mCtx.rect(ct + dx - 4, ct + dy - 4, 8, 8); mCtx.fill(); } else { const a = Math.atan2(dy, dx); mCtx.strokeStyle = '#ff1f1f'; mCtx.lineWidth = 2; mCtx.beginPath(); mCtx.moveTo(ct + Math.cos(a) * ct * 0.85, ct + Math.sin(a) * ct * 0.85); mCtx.lineTo(ct + Math.cos(a) * ct, ct + Math.sin(a) * ct); mCtx.stroke(); } } });
}

function init() {
    minimapCanvas.width = CONFIG.MINIMAP_SIZE; minimapCanvas.height = CONFIG.MINIMAP_SIZE;
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    player = new Player(0, 0); enemies = []; projectiles = []; items = []; particles = []; floatingTexts = [];
    score = 0; level = 1; exp = 0; expToNextLevel = 80; gameTime = 0; lastBossLevel = 0; lastEventTime = 0;
    bgOffsetX = 0; bgOffsetY = 0; lastTime = null; expMultiplier = 1; expMultiplierTimer = 0;
    combo = 0; comboTimer = 0; maxCombo = 0; waveActive = false; waveTimer = 0; waveType = ''; lastWaveTime = 0;
    squirtle = null; squirtleCooldown = 0; waveCountdown = 0; wavePending = null;
    applyTheme(); spawnEnemy();
}

function animate(time = 0) {
    if (gameState !== 'PLAYING') return;
    if (lastTime === null) { lastTime = time; requestAnimationFrame(animate); return; }
    const dt = Math.min((time - lastTime) / 1000, 0.1); lastTime = time; gameTime += dt;
    if (screenShake > 0) screenShake *= 0.85;

    // 콤보 타이머
    if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) { combo = 0; } }

    // 경험치 배율 타이머
    if (expMultiplierTimer > 0) { expMultiplierTimer -= dt; if (expMultiplierTimer <= 0 && !waveActive) { expMultiplier = 1; showToast('⭐ 경험치 2배 종료!'); } }

    // 웨이브 카운트다운
    if (waveCountdown > 0) {
        waveCountdown -= dt;
        if (waveCountdown <= 0 && wavePending) { triggerWave(); }
    }

    // 웨이브 타이머
    if (waveActive) { waveTimer -= dt; if (waveTimer <= 0) endWave(); }

    // 꼬부기 쿨다운
    if (squirtleCooldown > 0) squirtleCooldown -= dt;

    // 보급 상자 (35초마다)
    if (Math.floor(gameTime / 35) > lastEventTime) { lastEventTime = Math.floor(gameTime / 35); items.push(new Item(player.x + (Math.random() - 0.5) * 400, player.y + (Math.random() - 0.5) * 400, 'BOX')); showToast('📦 보급 상자 출현!'); }

    // 이벤트 스케줄러 (30초 주기 반복: 골든 -> 서바이벌 -> 러시)
    if (gameTime > 5 && !waveActive && waveCountdown <= 0) {
        const cycle = Math.floor(gameTime / 30) % 3; // 0, 1, 2
        const nextWaveTime = (Math.floor(gameTime / 30) + 1) * 30;

        // 웨이브 진입 3초 전 카운트다운 시작
        if (nextWaveTime - gameTime <= 3 && Math.floor(gameTime) > lastWaveTime) {
            lastWaveTime = Math.floor(gameTime);
            // 30초: 골든(1), 60초: 서바이벌(2), 90초: 러시(0) -> 순서 조정
            // 1cycle(30s): GOLDEN, 2cycle(60s): SURVIVAL, 3cycle(90s): RUSH
            let nextType = '';
            if (cycle === 0) nextType = 'GOLDEN';      // 30초, 120초...
            else if (cycle === 1) nextType = 'SURVIVAL'; // 60초, 150초...
            else nextType = 'RUSH';       // 90초, 180초...

            // 러시는 90초마다 (cycle이 2일 때)
            if (nextType) startWaveCountdown(nextType);
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save();
    const camX = canvas.width / 2 - player.x, camY = canvas.height / 2 - player.y;
    if (screenShake > 1) ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    ctx.translate(camX, camY);

    player.update(dt);
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle);
    if (player.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.4;
    if (player.invincible > 120) { ctx.shadowColor = '#54a0ff'; ctx.shadowBlur = 20; }
    if (player.img.complete) ctx.drawImage(player.img, -48, -48, 96, 96); ctx.restore();

    // ===== 꼬부기 서포터 =====
    if (squirtle) {
        squirtle.timer -= dt;
        // 플레이어 주변을 회전하며 따라다님
        squirtle.angle += 2.5 * dt;
        const sd = 90, sx = player.x + Math.cos(squirtle.angle) * sd, sy = player.y + Math.sin(squirtle.angle) * sd;
        squirtle.x = sx; squirtle.y = sy;
        // 그리기
        ctx.save(); ctx.translate(sx, sy);
        ctx.shadowColor = '#54a0ff'; ctx.shadowBlur = 12;
        if (SQUIRTLE_IMG.complete) ctx.drawImage(SQUIRTLE_IMG, -30, -30, 60, 60);
        ctx.restore();
        // 물대포: 가장 가까운 적에게 자동 공격
        squirtle.atkTimer -= dt;
        if (squirtle.atkTimer <= 0) {
            squirtle.atkTimer = 0.4;
            let near = null, minD = Infinity;
            enemies.forEach(e => { if (!e.destroyed) { const d = Math.hypot(e.x - sx, e.y - sy); if (d < minD) { minD = d; near = e; } } });
            if (near && minD < 350) {
                const a = Math.atan2(near.y - sy, near.x - sx);
                // 물대포 발사! (WATER 타입, 데미지 2.0)
                projectiles.push(new Projectile(sx, sy, a, '#54a0ff', 7, 2.0, false, false, false, 0, 'WATER'));
            }
        }
        // 주변 적에게 데미지
        enemies.forEach(e => { if (!e.destroyed && Math.hypot(e.x - sx, e.y - sy) < 40) e.takeDamage(0.05); });
        if (squirtle.timer <= 0) { squirtle = null; floatingTexts.push(new FloatingText(player.x, player.y - 50, '🐢 꼬부기 퇴장!', '#54a0ff', true)); }
    }

    player.weapons.forEach(w => { if (w.type.id === 'LEAF') { const c = 2 + w.level, d = 80 + w.level * 5; for (let i = 0; i < c; i++) { const a = w.leafAngle + (Math.PI * 2 / c) * i, lx = player.x + Math.cos(a) * d, ly = player.y + Math.sin(a) * d; ctx.save(); ctx.translate(lx, ly); ctx.rotate(a); ctx.shadowColor = '#44ff44'; ctx.shadowBlur = 8; ctx.fillStyle = '#44ff44'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(14, 14); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#88ff88'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill(); ctx.restore(); enemies.forEach(e => { if (!e.destroyed && Math.hypot(lx - e.x, ly - e.y) < 25 + e.radius) e.takeDamage(0.07 * Math.pow(1.2, (player.passives.POW || 0))); }); } } });

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i]; if (e.destroyed) { enemies.splice(i, 1); continue; } e.update();
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle); if (e.hitFlash > 0) { ctx.filter = 'brightness(3)'; ctx.scale(1.1, 1.1); }
        const imgSize = e.isBoss ? e.radius * 3 : e.radius * 4.5; if (e.img && e.img.complete) ctx.drawImage(e.img, -imgSize, -imgSize, imgSize * 2, imgSize * 2); ctx.restore();
        if (e.hp < e.maxHp || e.isBoss) { const bw = e.radius * 2, bh = e.isBoss ? 8 : 4; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - bw / 2, e.y + e.radius + 10, bw, bh); ctx.fillStyle = e.isBoss ? '#ff1f1f' : '#2ecc71'; ctx.fillRect(e.x - bw / 2, e.y + e.radius + 10, bw * (e.hp / e.maxHp), bh); }
        if (e.isBoss) { ctx.save(); ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#ff1f1f'; ctx.textAlign = 'center'; ctx.fillText(e.bossName, e.x, e.y - e.radius - 8); ctx.restore(); }
        if (player.invincible <= 0 && Math.hypot(e.x - player.x, e.y - player.y) < e.radius + 16) {
            player.hp--; player.invincible = 60; screenShake = 25; combo = 0; comboTimer = 0; // 피격 시 콤보 리셋
            if (player.hp <= 0) {
                gameState = 'GAME_OVER'; saveHighScores();
                gameOverScreen.classList.remove('hidden');
                const theme = getCurrentTheme();
                document.getElementById('final-score').innerHTML = `
                    <div style="font-family:sans-serif;line-height:2;text-align:center;">
                        <div style="font-size:14px;color:#ffcb05;margin-bottom:8px;">📊 이번 판 기록</div>
                        <div>🏆 킬 수: <b style="color:#ffcb05">${score}</b></div>
                        <div>📈 레벨: <b style="color:#2ecc71">Lv.${level}</b> (${theme.name})</div>
                        <div>🔥 최대 콤보: <b style="color:#ff9f43">${maxCombo}</b></div>
                        <div>⏱️ 생존: <b>${Math.floor(gameTime / 60)}분 ${Math.floor(gameTime % 60)}초</b></div>
                        <hr style="border-color:rgba(255,255,255,0.2);margin:10px 0;">
                        <div style="font-size:12px;color:#aaa;">🏅 역대 최고 기록</div>
                        <div style="font-size:11px;">킬: <b style="color:#ffcb05">${highScore}</b> | Lv: <b style="color:#2ecc71">${highLevel}</b> | 콤보: <b style="color:#ff9f43">${highCombo}</b></div>
                    </div>`;
            }
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) { const p = projectiles[i]; if (p.destroyed) { projectiles.splice(i, 1); continue; } p.update(); if (p.destroyed) { projectiles.splice(i, 1); continue; } p.draw(); if (Math.hypot(p.x - player.x, p.y - player.y) > 1000) p.destroyed = true; }

    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]; it.draw(); const mr = 40 + (player.passives.MAG || 0) * 40;
        if (Math.hypot(it.x - player.x, it.y - player.y) < mr) {
            switch (it.type) {
                case 'GEM': { const amt = Math.floor(20 * expMultiplier * it.value); exp += amt; if (expMultiplier > 1 || it.value > 1) floatingTexts.push(new FloatingText(it.x, it.y - 20, `+${amt} EXP`, '#d4fc79', false)); if (exp >= expToNextLevel) { level++; exp = 0; expToNextLevel = Math.floor(80 + level * 15); handleLevelUp(); } break; }
                case 'MAGNET': items.filter(t => t.type === 'GEM').forEach(t => { t.x = player.x; t.y = player.y; }); floatingTexts.push(new FloatingText(it.x, it.y - 20, '🧲 자석! 보석 흡수!', '#ff44ff', true)); showToast('🧲 자석 발동!'); break;
                case 'BOX': floatingTexts.push(new FloatingText(it.x, it.y - 20, '🎁 보물 상자 GET!', '#ffcb05', true)); handleLevelUp(); break;
                case 'HEAL': player.hp = Math.min(player.maxHp, player.hp + 1); floatingTexts.push(new FloatingText(it.x, it.y - 25, '🍎 HP +1 회복!', '#ff4d4d', true)); showToast('🍎 체력 회복!'); break;
                case 'EXPUP': expMultiplier = 2; expMultiplierTimer = 10; floatingTexts.push(new FloatingText(it.x, it.y - 25, '⭐ 경험치 2배! (10초)', '#d4fc79', true)); showToast('⭐ 10초간 경험치 2배!'); break;
                case 'SHIELD': player.invincible = 300; floatingTexts.push(new FloatingText(it.x, it.y - 25, '🛡️ 5초간 무적!', '#54a0ff', true)); showToast('🛡️ 5초간 무적!'); break;
            }
            items.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) { const pa = particles[i]; pa.update(); pa.draw(); if (pa.a <= 0) particles.splice(i, 1); }
    for (let i = floatingTexts.length - 1; i >= 0; i--) { const ft = floatingTexts[i]; ft.update(); ft.draw(); if (ft.life <= 0) floatingTexts.splice(i, 1); }
    ctx.restore();

    // === HUD (카메라 밖) ===
    // 콤보 표시
    if (combo >= 3) {
        ctx.save(); ctx.font = `bold ${16 + Math.min(combo, 20)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillStyle = combo >= 20 ? '#ff44ff' : combo >= 10 ? '#ee5253' : '#ffcb05';
        ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
        const txt = `🔥 ${combo} COMBO`;
        ctx.strokeText(txt, canvas.width / 2, canvas.height - 70); ctx.fillText(txt, canvas.width / 2, canvas.height - 70);
        ctx.restore();
    }
    // 경험치 배율
    if (expMultiplier > 1) { ctx.save(); ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#d4fc79'; ctx.textAlign = 'center'; ctx.fillText(`⭐ EXP x${expMultiplier} (${Math.ceil(waveActive && waveType === 'GOLDEN' ? waveTimer : expMultiplierTimer)}s)`, canvas.width / 2, 25); ctx.restore(); }
    // 웨이브 알림 바
    if (waveActive) {
        const barW = 200, barH = 6, barX = (canvas.width - barW) / 2, barY = 34;
        const colors = { RUSH: '#ee5253', GOLDEN: '#ffcb05', SURVIVAL: '#54a0ff' };
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = colors[waveType] || '#fff';
        const maxDur = { RUSH: 20, GOLDEN: 15, SURVIVAL: 10 }[waveType] || 10; // 러시 지속시간 20초로 변경
        ctx.fillRect(barX, barY, barW * (waveTimer / maxDur), barH);
        ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        const labels = { RUSH: '🌊 몬스터 러시!', GOLDEN: '✨ 골든 타임!', SURVIVAL: '💀 서바이벌!' };
        ctx.fillText(`${labels[waveType]} ${Math.ceil(waveTimer)}s`, canvas.width / 2, barY + barH + 14);
        ctx.restore();
        // 서바이벌: 붉은 테두리 경고
        if (waveType === 'SURVIVAL') {
            ctx.save(); ctx.strokeStyle = 'rgba(238,82,83,0.5)'; ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
            ctx.restore();
        }
        // 골든타임: 황금 테두리
        if (waveType === 'GOLDEN') {
            ctx.save(); ctx.strokeStyle = 'rgba(255,203,5,0.3)'; ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
            ctx.restore();
        }
    }
    // 웨이브 카운트다운 표시
    if (waveCountdown > 0 && wavePending) {
        ctx.save(); ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.strokeStyle = 'black'; ctx.lineWidth = 5;
        const num = Math.ceil(waveCountdown).toString();
        ctx.strokeText(num, canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillText(num, canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#ee5253';
        ctx.fillText(wavePending.name, canvas.width / 2, canvas.height / 2 - 20);
        ctx.restore();
    }
    // 꼬부기 쿨다운 UI (좌하단 제거됨 - 상단 UI로 대체)
    // 스테이지 이름
    const theme = getCurrentTheme();
    ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'right'; ctx.fillText(`📍 ${theme.name}`, canvas.width - 15, canvas.height - 10); ctx.restore();

    updateUI(); drawMinimap(); requestAnimationFrame(animate);
}

startBtn.onclick = () => { startScreen.classList.add('hidden'); gameState = 'PLAYING'; init(); animate(); };
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // 스페이스바: 꼬부기 소환
    if (e.key === ' ' && gameState === 'PLAYING' && !squirtle && squirtleCooldown <= 0) {
        squirtle = { x: player.x, y: player.y, angle: 0, timer: 8, atkTimer: 0 };
        squirtleCooldown = 30; // 30초 쿨다운
        floatingTexts.push(new FloatingText(player.x, player.y - 50, '🐢 꼬부기 출동!', '#54a0ff', true));
        showToast('🐢 꼬부기가 8초간 도와준다!');
        screenShake = 8;
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);
window.onload = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
