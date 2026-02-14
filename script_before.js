/**
 * 탕탕포켓몬 - 게임 로직
 * @author Gora-pa-duck (Duck Developer)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameOverScreen = document.getElementById('game-over-screen');
const levelUpModal = document.getElementById('level-up-modal');
const expBar = document.getElementById('exp-bar');
const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer-display');
const killDisplay = document.getElementById('score-display');
const skillOptionsContainer = document.getElementById('skill-options');

// 게임 상태
let gameState = 'START';
let score = 0;
let level = 1;
let exp = 0;
let expToNextLevel = 100;
let gameTime = 0;
let lastTime = 0;

// 조이스틱 대신 마우스/터치 드래그로 조작 유도
let keys = {};
let player, enemies, projectiles, gems, particles, envObjects;
let screenShake = 0;
let squirtle = null;
let currentBoss = null;
let squirtleCooldown = 0;
const SQUIRTLE_DURATION = 30; // 30초 지속
const SQUIRTLE_COOLDOWN_MAX = 60; // 60초 쿨타임
let bgOffsetX = 0;
let bgOffsetY = 0;

// 이미지 프리로드 (PokeAPI 이미지 활용)
const PIKACHU_IMG = new Image();
PIKACHU_IMG.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';

const ENEMY_IMGS = [
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png', // Rattata
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png', // Pidgey
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png'  // Caterpie
].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

const SQUIRTLE_IMG = new Image();
SQUIRTLE_IMG.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png';

const BOSS_IMGS = {
    4: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png',  // Jammanbo (Snorlax)
    8: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/76.png',   // Ttakguri (Golem)
    12: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/248.png' // Magiras (Tyranitar)
};

// 설정
const CONFIG = {
    PLAYER_SPEED: 3,
    ENEMY_SPAWN_RATE: 1500, // ms
    GEM_RADIUS: 5,
    PROJECTILE_SPEED: 6
};

class Entity {
    constructor(x, y, radius, img) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.img = img;
        this.angle = 0;
    }

    draw() {
        ctx.save();

        // 무적 상태일 때 깜빡임 효과
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        if (this.img && this.img.complete) {
            ctx.drawImage(this.img, -this.radius * 2, -this.radius * 2, this.radius * 4, this.radius * 4);
        }
        ctx.restore();
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 15, PIKACHU_IMG);
        this.maxHp = 3;
        this.hp = 3;
        this.invincible = 0; // 무적 프레임
        this.attackTimer = 0;
        this.attackInterval = 1000;
        this.skills = ['ThunderBolt'];
    }

    update() {
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['w']) dy -= CONFIG.PLAYER_SPEED;
        if (keys['ArrowDown'] || keys['s']) dy += CONFIG.PLAYER_SPEED;
        if (keys['ArrowLeft'] || keys['a']) dx -= CONFIG.PLAYER_SPEED;
        if (keys['ArrowRight'] || keys['d']) dx += CONFIG.PLAYER_SPEED;

        // 대각선 이동 속도 보정
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x + dx));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y + dy));

        // 배경 스크롤 효과 (플레이어 이동의 반대 방향으로 배경 이동)
        bgOffsetX -= dx * 0.5;
        bgOffsetY -= dy * 0.5;
        const container = document.getElementById('game-container');
        container.style.backgroundPosition = `${bgOffsetX}px ${bgOffsetY}px, ${bgOffsetX + 20}px ${bgOffsetY + 20}px`;

        if (dx !== 0 || dy !== 0) {
            this.angle = Math.atan2(dy, dx);
        }

        if (this.invincible > 0) this.invincible--;

        // 자동 공격
        this.attackTimer += 16.6;
        if (this.attackTimer >= this.attackInterval) {
            this.shoot();
            this.attackTimer = 0;
        }
    }

    shoot() {
        // 가장 가까운 적 찾기
        let nearestEnemy = null;
        let minDist = Infinity;

        enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                nearestEnemy = enemy;
            }
        });

        if (nearestEnemy) {
            const angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            projectiles.push(new Projectile(this.x, this.y, angle, '#fffc00'));
        }
    }
}

class Supporter extends Entity {
    constructor(player) {
        super(player.x, player.y, 14, SQUIRTLE_IMG);
        this.player = player;
        this.offsetAngle = 0;
        this.timer = SQUIRTLE_DURATION;
        this.attackTimer = 0;
    }

    update(dt) {
        this.timer -= dt;
        this.offsetAngle += 0.05;
        this.x = this.player.x + Math.cos(this.offsetAngle) * 50;
        this.y = this.player.y + Math.sin(this.offsetAngle) * 50;

        this.attackTimer += dt * 1000;
        if (this.attackTimer > 500) { // 0.5초마다 전방향 물대포
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                projectiles.push(new Projectile(this.x, this.y, angle, '#00ccff', 8));
            }
            this.attackTimer = 0;
        }
    }
}

class Enemy extends Entity {
    constructor() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * canvas.width; y = -50; }
        else if (side === 1) { x = canvas.width + 50; y = Math.random() * canvas.height; }
        else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 50; }
        else { x = -50; y = Math.random() * canvas.height; }

        const img = ENEMY_IMGS[Math.floor(Math.random() * ENEMY_IMGS.length)];

        // 레벨에 따른 스케일링
        const sizeMod = Math.min(10, level);
        super(x, y, 12 + sizeMod, img);

        this.maxHp = 1 + Math.floor(level / 2);
        this.hp = this.maxHp;
        this.speed = 1 + Math.random() * 1.5 + (level * 0.15);
        this.hitFlash = 0;
    }

    update(target) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        this.angle = angle;
        if (this.hitFlash > 0) this.hitFlash--;
    }

    draw() {
        ctx.save();

        // 무적 상태일 때 깜빡임 효과 (Entity에서 이동해옴)
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 맞았을 때 번쩍이는 효과
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(3)';
            ctx.scale(1.2, 1.2);
        }

        if (this.img && this.img.complete) {
            ctx.drawImage(this.img, -this.radius * 2, -this.radius * 2, this.radius * 4, this.radius * 4);
        }
        ctx.restore();

        // HP 바 표시 (피가 2 이상일 때만)
        if (this.maxHp > 1 && !this.isBoss) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30, 4);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30 * (this.hp / this.maxHp), 4);
        }
    }
}

class Boss extends Enemy {
    constructor(lvl) {
        super();
        this.lvl = lvl;
        const img = new Image();
        img.src = BOSS_IMGS[lvl] || BOSS_IMGS[4];
        this.img = img;

        this.radius = 40 + (lvl * 2);
        this.maxHp = 50 + (lvl * 20);
        this.hp = this.maxHp;
        this.speed = 0.5 + (lvl * 0.05);
        this.isBoss = true;
    }

    draw() {
        super.draw();
        // 보스 전용 상단 HP 바
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const barWidth = canvas.width * 0.8;
        const x = (canvas.width - barWidth) / 2;
        const y = 80;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, barWidth, 10);
        ctx.fillStyle = '#ff1f1f';
        ctx.fillRect(x, y, barWidth * (this.hp / this.maxHp), 10);

        ctx.font = '10px "Press Start 2P"';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText("BOSS APPEARED!", canvas.width / 2, y - 10);
        ctx.restore();
    }
}

class Projectile extends Entity {
    constructor(x, y, angle, color = '#fffc00', speed = 6) {
        super(x, y, 5, null);
        this.angle = angle;
        this.color = color;
        this.speed = speed;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(-10, -2, 20, 4);
        ctx.restore();
    }
}

class Gem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.GEM_RADIUS;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffcc';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }
}

class Particle extends Entity {
    constructor(x, y, color) {
        super(x, y, 2, null);
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Environment {
    constructor() {
        // 월드 좌표 (캔버스보다 훨씬 큰 범위에 생성)
        this.worldX = (Math.random() - 0.5) * 2000;
        this.worldY = (Math.random() - 0.5) * 2000;
        this.type = Math.floor(Math.random() * 3); // 0: 꽃, 1: 돌, 2: 풀숲
        this.color = ['#ff6b6b', '#f9ca24', '#f093fb'][this.type];
    }

    draw() {
        // 배경 오프셋을 적용한 화면 좌표 계산
        const screenX = this.worldX + (bgOffsetX * 2);
        const screenY = this.worldY + (bgOffsetY * 2);

        // 화면 안에 있을 때만 그리기
        if (screenX > -50 && screenX < canvas.width + 50 &&
            screenY > -50 && screenY < canvas.height + 50) {
            ctx.save();
            ctx.translate(screenX, screenY);

            // 간단한 도트 꽃 그리기
            ctx.fillStyle = this.color;
            ctx.fillRect(-2, -2, 4, 4);
            ctx.fillRect(-4, 0, 8, 2);
            ctx.fillRect(0, -4, 2, 8);

            ctx.restore();
        }
    }
}

function init() {
    resize();
    player = new Player(canvas.width / 2, canvas.height / 2);
    enemies = [];
    projectiles = [];
    gems = [];
    particles = [];
    envObjects = Array.from({ length: 50 }, () => new Environment()); // 장식 요소 50개 생성
    score = 0;
    level = 1;
    exp = 0;
    gameTime = 0;
    updateUI();
}

function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

function updateUI() {
    expBar.style.width = (exp / expToNextLevel * 100) + '%';

    // 하트 표시 로직
    let hearts = '';
    for (let i = 0; i < player.maxHp; i++) {
        hearts += (i < player.hp) ? '❤️' : '🖤';
    }
    levelDisplay.innerText = `LV.${level} ${hearts}`;

    killDisplay.innerText = `KILLS: ${score}`;

    let mins = Math.floor(gameTime / 60);
    let secs = Math.floor(gameTime % 60);
    timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const squirtleIcon = document.getElementById('squirtle-ui-icon');
    const squirtleText = document.getElementById('squirtle-ready-text');

    if (squirtle) {
        squirtleIcon.classList.remove('gray', 'ready');
        squirtleText.innerText = `${Math.ceil(squirtle.timer)}s`;
        squirtleText.classList.add('cooling');
    } else if (squirtleCooldown > 0) {
        squirtleIcon.classList.add('gray');
        squirtleIcon.classList.remove('ready');
        squirtleText.innerText = `${Math.ceil(squirtleCooldown)}s`;
        squirtleText.classList.add('cooling');
    } else {
        squirtleIcon.classList.remove('gray');
        squirtleIcon.classList.add('ready');
        squirtleText.innerText = `READY`;
        squirtleText.classList.remove('cooling');
    }
}

function spawnEnemy() {
    if (gameState !== 'PLAYING' && gameState !== 'LEVEL_UP') return;

    if (gameState === 'PLAYING') {
        // 4단계마다 보스 등장 (현재 보스가 없을 때만)
        if (level % 4 === 0 && !currentBoss) {
            currentBoss = new Boss(level);
            enemies.push(currentBoss);
            screenShake = 50; // 등판 시 강한 진동!
        } else {
            enemies.push(new Enemy());
        }
    }

    const spawnRate = Math.max(300, CONFIG.ENEMY_SPAWN_RATE - (gameTime * 10));
    setTimeout(spawnEnemy, spawnRate);
}

function handleLevelUp() {
    gameState = 'LEVEL_UP';
    lastTime = 0; // 시간 버그 방지: 타이머 초기화용으로 0 설정
    levelUpModal.classList.remove('hidden');

    // 더미 스킬 옵션 생성
    skillOptionsContainer.innerHTML = '';
    const mockSkills = [
        { name: '공격 속도 증가', desc: '더 빠르게 전기를 발사합니다.', icon: '⚡' },
        { name: '이동 속도 증가', desc: '바람처럼 빠르게 움직입니다.', icon: '👟' },
        { name: '체력 회복', desc: '급식을 먹고 체력을 회복합니다.', icon: '🍱' }
    ];

    mockSkills.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'skill-card';
        div.innerHTML = `
            <div class="skill-icon">${skill.icon}</div>
            <div class="skill-info">
                <div class="skill-name">${skill.name}</div>
                <div class="skill-desc">${skill.desc}</div>
            </div>
        `;
        div.onclick = () => {
            if (skill.name === '공격 속도 증가') player.attackInterval *= 0.7;
            if (skill.name === '이동 속도 증가') CONFIG.PLAYER_SPEED += 0.8;
            if (skill.name === '체력 회복') player.hp = Math.min(player.maxHp, player.hp + 1);

            gameState = 'PLAYING';
            levelUpModal.classList.add('hidden');
            animate();
        };
        skillOptionsContainer.appendChild(div);
    });
}

function animate(time = 0) {
    if (gameState !== 'PLAYING') return;

    // 시간 버그 수정: lastTime이 없거나 비상상식적인 경우 처리
    if (!lastTime || time < lastTime) {
        lastTime = time;
        requestAnimationFrame(animate);
        return;
    }

    const deltaTime = time - lastTime;
    const dtSeconds = deltaTime / 1000;
    lastTime = time;
    gameTime += dtSeconds;

    if (squirtle) {
        squirtle.update(dtSeconds);
        if (squirtle.timer <= 0) {
            squirtle = null;
            squirtleCooldown = SQUIRTLE_COOLDOWN_MAX;
        }
    } else if (squirtleCooldown > 0) {
        squirtleCooldown -= dtSeconds;
    }

    if (screenShake > 0) screenShake *= 0.9;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 모든 드로우 시점에 화면 흔들림 효과를 일관되게 적용하기 위해 ctx.save/restore 활용
    ctx.save();
    if (screenShake > 1) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    // 배경 장식 요소 그리기
    envObjects.forEach(obj => obj.draw());

    // 파티클 업데이트
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) particles.splice(i, 1);
    }

    player.update();
    player.draw();
    if (squirtle) squirtle.draw();

    // 탄환 업데이트
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        p.draw();

        // 화면 밖 제거
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }

        // 적 충돌 확인
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) {
                // 적 처치 이펙트 (파티클 & 흔들림)
                for (let k = 0; k < 5; k++) particles.push(new Particle(e.x, e.y, '#fffc00'));

                e.hp--;
                e.hitFlash = 5;
                projectiles.splice(i, 1);

                if (e.hp <= 0) {
                    for (let k = 0; k < 8; k++) particles.push(new Particle(e.x, e.y, '#ff4444'));
                    screenShake = 12;

                    if (e.isBoss) {
                        currentBoss = null;
                        screenShake = 100; // 보스 격파 시 폭발적인 진동!
                        for (let k = 0; k < 50; k++) {
                            const p = new Particle(e.x, e.y, '#ffcb05');
                            p.vx *= 2; p.vy *= 2;
                            particles.push(p);
                        }
                        // 대량의 보석 드랍
                        for (let k = 0; k < 15; k++) {
                            gems.push(new Gem(e.x + (Math.random() - 0.5) * 100, e.y + (Math.random() - 0.5) * 100));
                        }
                    }

                    gems.push(new Gem(e.x, e.y));
                    enemies.splice(j, 1);
                    score++;
                } else {
                    screenShake = 3;
                }
                break;
            }
        }
    }

    // 적 업데이트
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update(player);
        e.draw();

        // 플레이어 충돌
        if (player.invincible <= 0 && Math.hypot(e.x - player.x, e.y - player.y) < (e.radius + player.radius) * 0.8) {
            player.hp--;
            player.invincible = 90; // 약 1.5초 무적
            screenShake = 30; // 강한 충격!

            if (player.hp <= 0) {
                gameState = 'GAME_OVER';
                document.getElementById('final-score').innerText = `최종 킬 수: ${score}`;
                gameOverScreen.classList.remove('hidden');
            }
        }
    }

    // 경험치 젬 업데이트
    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        g.draw();

        if (Math.hypot(g.x - player.x, g.y - player.y) < 40) {
            gems.splice(i, 1);
            exp += 25;
            // 경험치 획득 시 살짝 흔들림
            screenShake = 3;

            if (exp >= expToNextLevel) {
                level++;
                exp = 0;
                expToNextLevel = Math.floor(expToNextLevel * 1.3);
                handleLevelUp();
            }
        }
    }

    ctx.restore(); // 화면 흔들림 사후 처리

    updateUI();
    requestAnimationFrame(animate);
}

// 이벤트 리스너
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.code === 'Space' && gameState === 'PLAYING' && !squirtle && squirtleCooldown <= 0) {
        squirtle = new Supporter(player);
        screenShake = 20; // 소환 시 진동!
        for (let i = 0; i < 15; i++) particles.push(new Particle(player.x, player.y, '#00ccff'));
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);
window.addEventListener('resize', resize);

startBtn.onclick = () => {
    startScreen.classList.add('hidden');
    gameState = 'PLAYING';
    init();
    spawnEnemy();
    requestAnimationFrame(animate);
};

// 초기화 호출
resize();
