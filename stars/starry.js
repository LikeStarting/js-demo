const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;
const hue = 217;

function random(min = 0, max = 1) {
  if (min > max) {
    const t = min;
    min = max;
    max = t;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Star(x, y, radius, alpha) {
  this.x = x;
  this.y = y;
  this.radius = radius || random(60, width / 1.5) / 12;
  this.alpha = alpha || 1;
}

Star.prototype.draw = function (ctx, starCache) {
  this.x += 0.5 * Math.random() * Math.random();
  if (this.x > width) this.x = 0

  const twinkle = random(0, 10);

  if (twinkle === 1 && this.alpha > 0) {
    this.alpha += 0.05;
  }
  if (twinkle === 2 && this.alpha < 1) {
    this.alpha -= 0.05;
  }

  ctx.globalAlpha = this.alpha;
  ctx.drawImage(starCache, this.x - this.radius / 2, this.y - this.radius / 2, this.radius, this.radius);
}

function Render(ctx) {
  this.ctx = ctx;
  this.stars = [];
  this.starCounts = 200;
  this.cacheCanvas = {
    star: _starCanvas()
  }

  function _starCanvas() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width = 100;
    const h = canvas.height = 100;
    const gradientCache = ctx.createRadialGradient(
      w/2,
      h/2,
      0,
      w/2,
      h/2,
      w/2
    );
    gradientCache.addColorStop(0.025, '#fff');
    gradientCache.addColorStop(0.1, `hsl(${hue}, 61%, 33%)`);
    gradientCache.addColorStop(0.25, `hsl(${hue}, 64%, 6%)`);
    gradientCache.addColorStop(1, 'transparent');

    ctx.fillStyle = gradientCache;
    ctx.beginPath();
    ctx.arc(w/2, h/2, w/2, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  this.init();
}

Render.prototype.init = function () {
  for (let i = 0; i < this.starCounts; i++) {
    const alpha = random(2, 10) / 10;
    const radius = random(60, width / 3) / 12;
    this.stars.push(new Star(random(0, width), random(0, height), radius, alpha));
  }
}

Render.prototype.draw = function () {
  this.ctx.globalCompositeOperation = 'source-over';
  this.ctx.globalAlpha = 0.8;
  this.ctx.fillStyle = `hsla(${hue}, 64%, 6%, 1)`;

  this.ctx.fillRect(0, 0, width, height);
  this.ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < this.stars.length; i++) {
    this.stars[i].draw(this.ctx, this.cacheCanvas.star)
  }
  window.requestAnimationFrame(this.draw.bind(this));
}

const renderer = new Render(ctx);
renderer.draw();