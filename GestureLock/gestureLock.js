(function (w) {
  function GestureLock(options) {    
    this.el = options.el || document.body;
    this.type = options.type || 3;
    this.style = options.style || {
      color: '#ffa726',
      circleLineWidth: 2,
      lineWidth: 3,
      lineColor： '',
    };

    const { width, height } = GestureLock._getComputedSize(this.el)
    this.width = options.width || width;
    this.height = options.height || height;
    this.devicePixelRatio = w.devicePixelRatio || 1;

    this.circles = [];
    this.spareCircles = [];
  }

  GestureLock._getComputedSize = function(ele) {
    let { width, height } = ele.getBoundingRectClient();

    width = width < 300 ? 300 : width
    height = height < 300 ? 300 : height

    return {
      width,
      height
    }
  }

  GestureLock._drawCircle = function(ctx, point, style) {
    const { x, y, r } = point
    const { lineWidth, color } = style;

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.closePath();
  }

  GestureLock._drawFilledCircle = function(ctx, point, style) {
    const { x, y, r } = point
    const { color } = style;

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();
  }

  GestureLock._drawLine = function(ctx, points, style) {
    const { lineWidth, color } = style;
    const [p1, p2] = points;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.closePath();
  }

  GestureLock._getPosition = function(e) {
    const { left, top } = e.target.getBoundingRectClient();
    const { clientX, clientY } = e.touches[0];

    return {
      x: clientX - left, // x * this.devicePixelRatio ?
      y: clientY - top
    }
  }

  GestureLock.prototype.init = function() {
    this.createCanvas();
  }

  // create two canvas elements
  GestureLock.prototype.createCanvas = function() {
    const canvas = document.createElement('canvas');
 
    canvas.style.width = this.width;
    canvas.style.height = this.height;
    canvas.width = this.width * this.devicePixelRatio;
    canvas.height = this.height * this.devicePixelRatio;

    const canvas2 = canvas.cloneNode(canvas, true);
    canvas.style.position = "absolute";
    canvas.style.left = '0';
    canvas.style.top = '0';

    this.canvas = this.canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas2 = this.canvas2;
    this.ctx2 = canvas2.getContext('2d');

    this.el.appendChild(canvas);
    this.el.appendChild(canvas2);
  }

  GestureLock.prototype.createCircle = function() {
    const n = this.type;
    const r = this.r = Math.floor(this.width / (n * 2 * 2 + 2));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const point = {
          x: (2 + 1) * r + 4 * r * j,
          y: (2 + 1) * r + 4 * r * i,
          r: r,
          id: `${i}-${j}`,
        };
        this.circles.push(point);
        this.spareCircles.push(point);
      }
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawCircle();
  }

  GestureLock.prototype.drawCircle = function() {
    const { ctx, style } = this;
    this.circles.forEach(p => {
      GestureLock._drawCircle(ctx, p, style)
    })
  }

  GestureLock.prototype.checkCurrentPoint = function(point) {
    const { x, y } = point;

    const index = this.spareCircles.findIndex(c => {
      if (Math.abs(c.x - x) < r && Math.abs(c.y - y) < r) {
        this.touched = true;
        this.touchedCircles.push(point);
        return true;
      }

      return false;
    })

    index !== -1 && this.spareCircles.splice(index, 1);
  }

  GestureLock.prototype.update = function(point) {
    const { ctx, touchedCircles, style } = this;
    const { length }= touchedCircles;
    const { lineWidth, lineColor } = style;

    if (length >= 1) {
      GestureLock._drawLine(ctx, [touchedCircles[length - 1], point], {
        color: lineColor,
        lineWidth 
      })
    }

    if (length >= 2) {
      GestureLock._drawLine(ctx, [touchedCircles[length - 2], touchedCircles[length - 1]], {
        color: lineColor,
        lineWidth
      })
    }
  }

  GestureLock.prototype.registerEventListener = function() {
    const { canvas2 } = this;

    canvas2.addEventListener('touchStart', (e) => {
      e.preventDefault();

      const curPoint = CanvasGradient._getPosition(e);
      this.spareCircles = this.spareCircles.concat(this.touchedCircles.splice(0));
      this.checkCurrentPoint(curPoint);
    }, false);

    this.addEventListener('touchmove', function(e) {
      const curPoint = CanvasGradient._getPosition(e);

      this.checkCurrentPoint(curPoint);
      if (this.touched) {
        this.update(curPoint);
      }
    }, false);

    this.addEventListener('touchend', function() {

    }, false);
  }

  w.GestureLock = GestureLock;
})(window)