class Sprite {
  constructor(imgPath, frameWidth, frameHeight, fps) {
    this.image = new Image();
    this.image.src = imgPath;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.fps = fps;

    this.currentFrame = 0;
    this.currentRow = 0;
    this.totalFrames = 1;
    this.timer = 0;
    this.loop = true;
    this.onFinish = null;
  }

  setAnimation(row, frames, loop = true, onFinish = null) {
    this.currentRow = row;
    this.currentFrame = 0;
    this.totalFrames = frames;
    this.loop = loop;
    this.onFinish = onFinish;
  }

  update(deltaTime) {
    this.timer += deltaTime;
    const frameDuration = 1000 / this.fps;

    if (this.timer >= frameDuration) {
      if (!this.loop && this.currentFrame === this.totalFrames - 1) {
        if (this.onFinish) this.onFinish();
        return;
      }

      this.currentFrame++;
      if (this.currentFrame >= this.totalFrames) {
        this.currentFrame = this.loop ? 0 : this.totalFrames - 1;
      }

      this.timer = 0;
    }
  }

  draw(ctx, x, y, scale = 2, flip = false) {
    ctx.save();
    if (flip) {
      ctx.scale(-1, 1);
      x = -x - this.frameWidth * scale;
    }

    ctx.drawImage(
      this.image,
      this.currentFrame * this.frameWidth,
      this.currentRow * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      x, y - this.frameHeight * scale,
      this.frameWidth * scale,
      this.frameHeight * scale
    );
    ctx.restore();
  }
}

class VerticalSprite extends Sprite {
  setAnimation(col, frames, loop = true, onFinish = null) {
    this.currentCol = col;
    this.currentFrame = 0;
    this.totalFrames = frames;
    this.loop = loop;
    this.onFinish = onFinish;
  }

  draw(ctx, x, y, scale = 2, flip = false) {
    ctx.save();
    if (flip) {
      ctx.scale(-1, 1);
      x = -x - this.frameWidth * scale;
    }

    ctx.drawImage(
      this.image,
      this.currentCol * this.frameWidth,
      this.currentFrame * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      x, y - this.frameHeight * scale,
      this.frameWidth * scale,
      this.frameHeight * scale
    );
    ctx.restore();
  }
}

// 🎮 Canvas
const canvas = document.getElementById("gameCanvas");
canvas.width = 1000;
canvas.height = 500;
const ctx = canvas.getContext("2d");

// 🌌 Background
const background = new Image();
background.src = "assets/Pixel-Art-RPG-backgrounds-Preview-01 - copia.jpg";

// 🟣 Héroe
const hero = new Sprite("NightBorne/NightBorne.png", 80, 80, 10);
const heroAnimations = {
  idle: { row: 0, frames: 9 },
  run: { row: 1, frames: 6 },
  attack: { row: 2, frames: 12 },
  hurt: { row: 3, frames: 5 },
  death: { row: 4, frames: 23 }
};
hero.setAnimation(heroAnimations.idle.row, heroAnimations.idle.frames);

let heroX = 200,
  heroY = canvas.height - 50;
hero.hp = 100;
hero.alive = true;
let heroFlip = false;
const heroSpeed = 4;

// Efecto de sacudida en vida del héroe
let heroShakeTime = 0;

// 🔥 Boss (Dragón)
const boss = new VerticalSprite("enemy/boss_paragon.png", 128, 128, 8);
const bossAnimations = {
  run: { col: 0, frames: 8 },
  idle: { col: 1, frames: 8 },
  hurt: { col: 2, frames: 5 },
  death: { col: 3, frames: 10 },
  attack1: { col: 5, frames: 12 },
  attack2: { col: 6, frames: 12 }
};
boss.setAnimation(bossAnimations.idle.col, bossAnimations.idle.frames);

let bossX = 700,
  bossY = canvas.height - 50;
boss.hp = 300;
boss.alive = true;
let bossFlip = true;

// 👹 Boss 2: Abominación
const abomination = new Sprite("enemy/f4_abomination.png", 140, 140, 8);
const abomAnimations = {
  idle: { row: 0, frames: 10 },
  run: { row: 1, frames: 8 },
  attack: { row: 2, frames: 20 },
  hurt: { row: 3, frames: 3 },
  death: { row: 4, frames: 15 }
};
abomination.setAnimation(abomAnimations.idle.row, abomAnimations.idle.frames);

let abomX = 700, abomY = canvas.height - 50;
abomination.hp = 400;
abomination.alive = false; // solo aparece después del dragón
let abomFlip = true;

// ❤️ Barra de vida
function drawHealthBar(ctx, x, y, hp, maxHp, width = 120, height = 12, shake = 0) {
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = "red";
  ctx.fillRect(x - width / 2, y, width, height);
  ctx.fillStyle = "green";
  ctx.fillRect(x - width / 2, y, (hp / maxHp) * width, height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(x - width / 2, y, width, height);
  ctx.restore();
}

// 📦 Hitbox helper
function getHitbox(x, y, width, height) {
  return {
    left: x,
    right: x + width,
    top: y - height,
    bottom: y
  };
}

// ⚔️ Daños del héroe al boss
function checkHeroAttack() {
  if (!boss.alive || !hero.alive) return;
  const attackFrames = [6, 7, 8];
  if (hero.currentRow === heroAnimations.attack.row && attackFrames.includes(hero.currentFrame)) {
    const heroHitbox = getHitbox(heroX, heroY, 80 * 2, 80 * 2);
    const bossHitbox = getHitbox(bossX, bossY, 128 * 3, 128 * 3);
    const overlap =
      heroHitbox.left < bossHitbox.right &&
      heroHitbox.right > bossHitbox.left &&
      heroHitbox.top < bossHitbox.bottom &&
      heroHitbox.bottom > bossHitbox.top;

    if (overlap) {
      boss.hp -= 20;
      if (boss.hp > 0) {
        boss.setAnimation(bossAnimations.hurt.col, bossAnimations.hurt.frames, false, () => {
          boss.setAnimation(bossAnimations.idle.col, bossAnimations.idle.frames);
        });
      } else {
        boss.alive = false;
        boss.setAnimation(bossAnimations.death.col, bossAnimations.death.frames, false);
      }
    }
  }
}

// ⚔️ Daño del héroe a la abominación
function checkHeroAttackAbom() {
  if (!abomination.alive || !hero.alive) return;
  const attackFrames = [6, 7, 8];
  if (hero.currentRow === heroAnimations.attack.row && attackFrames.includes(hero.currentFrame)) {
    const heroHitbox = getHitbox(heroX, heroY, 80 * 2, 80 * 2);
    const abomHitbox = getHitbox(abomX, abomY, 140 * 2.5, 140 * 2.5);
    const overlap =
      heroHitbox.left < abomHitbox.right &&
      heroHitbox.right > abomHitbox.left &&
      heroHitbox.top < abomHitbox.bottom &&
      heroHitbox.bottom > abomHitbox.top;

    if (overlap) {
      abomination.hp -= 20;
      if (abomination.hp > 0) {
        abomination.setAnimation(abomAnimations.hurt.row, abomAnimations.hurt.frames, false, () => {
          abomination.setAnimation(abomAnimations.idle.row, abomAnimations.idle.frames);
        });
      } else {
        abomination.alive = false;
        abomination.setAnimation(abomAnimations.death.row, abomAnimations.death.frames, false);
      }
    }
  }
}

// ⚔️ Daños del boss al héroe
function dealDamageToHero(dmg) {
  if (!hero.alive) return;
  const heroHitbox = getHitbox(heroX, heroY, 80 * 2, 80 * 2);

  // Hitbox dragón
  if (boss.alive) {
    const bossHitbox = getHitbox(bossX, bossY, 128 * 3, 128 * 3);
    const overlap =
      heroHitbox.left < bossHitbox.right &&
      heroHitbox.right > bossHitbox.left &&
      heroHitbox.top < bossHitbox.bottom &&
      heroHitbox.bottom > bossHitbox.top;
    if (overlap) {
      hero.hp -= dmg;
      heroShakeTime = 300;
      if (hero.hp <= 0) {
        hero.hp = 0;
        hero.alive = false;
        hero.setAnimation(heroAnimations.death.row, heroAnimations.death.frames, false);
      }
    }
  }

  // Hitbox abominación
  if (abomination.alive) {
    const abomHitbox = getHitbox(abomX, abomY, 140 * 2.5, 140 * 2.5);
    const overlap =
      heroHitbox.left < abomHitbox.right &&
      heroHitbox.right > abomHitbox.left &&
      heroHitbox.top < abomHitbox.bottom &&
      heroHitbox.bottom > abomHitbox.top;
    if (overlap) {
      hero.hp -= dmg;
      heroShakeTime = 300;
      if (hero.hp <= 0) {
        hero.hp = 0;
        hero.alive = false;
        hero.setAnimation(heroAnimations.death.row, heroAnimations.death.frames, false);
      }
    }
  }
}

// 🧠 Boss IA
let bossAttackTimer = 0;
let bossAttacking = false;
function bossAI(deltaTime) {
  if (!boss.alive) return;
  bossAttackTimer += deltaTime;
  const dx = heroX - bossX;
  const dy = heroY - bossY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (Math.abs(dx) > 20) bossFlip = dx > 0 ? false : true;
  if (!bossAttacking && distance < 180 && bossAttackTimer > 1000) {
    const attackChoice = Math.random() < 0.5 ? bossAnimations.attack1 : bossAnimations.attack2;
    boss.setAnimation(attackChoice.col, attackChoice.frames, false, () => {
      bossAttacking = false;
      boss.setAnimation(bossAnimations.idle.col, bossAnimations.idle.frames);
    });
    bossAttacking = true;
    bossAttackTimer = 0;
  }
  if (bossAttacking && boss.currentFrame === 6) dealDamageToHero(15);
  else if (!bossAttacking) {
    if (distance > 80) {
      bossX += dx > 0 ? 2 : -2;
      bossY += dy > 0 ? 1 : -1;
      boss.setAnimation(bossAnimations.run.col, bossAnimations.run.frames);
    }
  }
}

// 🧠 Abomination IA
let abomAttackTimer = 0;
let abomAttacking = false;
function abomAI(deltaTime) {
  if (!abomination.alive) return;
  abomAttackTimer += deltaTime;
  const dx = heroX - abomX;
  const dy = heroY - abomY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (Math.abs(dx) > 20) abomFlip = dx > 0 ? false : true;
  if (!abomAttacking && distance < 180 && abomAttackTimer > 1200) {
    abomination.setAnimation(abomAnimations.attack.row, abomAnimations.attack.frames, false, () => {
      abomAttacking = false;
      abomination.setAnimation(abomAnimations.idle.row, abomAnimations.idle.frames);
    });
    abomAttacking = true;
    abomAttackTimer = 0;
  }
  if (abomAttacking && abomination.currentFrame === 10) dealDamageToHero(20);
  else if (!abomAttacking) {
    if (distance > 80) {
      abomX += dx > 0 ? 2 : -2;
      abomY += dy > 0 ? 1 : -1;
      abomination.setAnimation(abomAnimations.run.row, abomAnimations.run.frames);
    }
  }
}

// 🎮 Controles héroe (WASD)
const keys = {};
document.addEventListener("keydown", (e) => {
  if (!hero.alive) return;
  keys[e.key.toLowerCase()] = true;
  if (e.key === " ") {
    if (hero.currentRow !== heroAnimations.attack.row) {
      hero.setAnimation(heroAnimations.attack.row, heroAnimations.attack.frames, false, () => {
        if (hero.alive) hero.setAnimation(heroAnimations.idle.row, heroAnimations.idle.frames);
      });
    }
  }
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
  if (
    hero.alive &&
    hero.currentRow !== heroAnimations.attack.row &&
    hero.currentRow !== heroAnimations.hurt.row &&
    hero.currentRow !== heroAnimations.death.row
  ) {
    hero.setAnimation(heroAnimations.idle.row, heroAnimations.idle.frames);
  }
});

// 🎮 Control de niveles
let currentLevel = 1;
let showTransition = false;
document.addEventListener("keydown", (e) => {
  if (showTransition && e.key === "Enter") {
    showTransition = false;
    currentLevel = 2;
    hero.hp = 100;
    hero.alive = true;
    abomination.alive = true;
    abomination.hp = 400;
  }
});

// 🔄 Loop
let lastTime = performance.now();
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Movimiento héroe
  if (hero.alive) {
    if (keys["w"] && heroY > 100) heroY -= heroSpeed;
    if (keys["s"] && heroY < canvas.height - 50) heroY += heroSpeed;
    if (keys["a"] && heroX > 0) {
      heroX -= heroSpeed;
      heroFlip = true;
      hero.setAnimation(heroAnimations.run.row, heroAnimations.run.frames);
    }
    if (keys["d"] && heroX < canvas.width - 50) {
      heroX += heroSpeed;
      heroFlip = false;
      hero.setAnimation(heroAnimations.run.row, heroAnimations.run.frames);
    }
  }

  // Héroe
  hero.update(deltaTime);
  hero.draw(ctx, heroX, heroY, 2, heroFlip);
  if (hero.currentRow === heroAnimations.attack.row) {
    if (currentLevel === 1) checkHeroAttack();
    if (currentLevel === 2) checkHeroAttackAbom();
  }

  let shake = 0;
  if (heroShakeTime > 0) {
    shake = (Math.random() - 0.5) * 10;
    heroShakeTime -= deltaTime;
  }
  drawHealthBar(ctx, heroX + 40, heroY - 150, hero.hp, 100, 120, 12, shake);

  // Boss 1
  if (currentLevel === 1) {
    boss.update(deltaTime);
    bossAI(deltaTime);
    boss.draw(ctx, bossX, bossY, 3, bossFlip);
    drawHealthBar(ctx, bossX + 60, bossY - 300, boss.hp, 300);
    if (!boss.alive) showTransition = true;
  }

  // Boss 2
  if (currentLevel === 2) {
    abomination.update(deltaTime);
    abomAI(deltaTime);
    abomination.draw(ctx, abomX, abomY, 2.5, abomFlip);
    drawHealthBar(ctx, abomX + 60, abomY - 300, abomination.hp, 400);
  }

  // Transición
  if (showTransition) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "yellow";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Has derrotado al Dragón", canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText("Prepárate para el jefe: La Abominación", canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Presiona ENTER para continuar", canvas.width / 2, canvas.height / 2 + 80);
  }

  // GAME OVER
  if (!hero.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  }

  // WIN
  if (currentLevel === 2 && !abomination.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "lime";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
  }

  requestAnimationFrame(gameLoop);
}
gameLoop(lastTime);
