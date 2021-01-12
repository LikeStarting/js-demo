(function (w) {
  function GestureLock(options = {}) {    
    this.ele = options.ele || document.body;
    this.type = options.type > 3 ? options.type : 3;
    this.style = options.style || {
      color: '#ffa726',
      circleLineWidth: 2,
      lineWidth: 3,
      lineColor: '#ffa726',
      dotColor: '#ffa726',
    };

    const { width, height } = GestureLock._getComputedSize(this.ele)
    this.width = options.width || width;
    this.height = options.height || height;
    this.devicePixelRatio = w.devicePixelRatio || 1;

    this.circles = [];
    this.spareCircles = [];
    this.touchedCircles = [];
    this.touched = false;
    this.redraw = false;
    this.reseted = true;

    this.messageEle = options.messageEle;
    this.resetEle = options.resetEle;
  }

  GestureLock._getComputedSize = function(ele) {
    let { width, height } = ele.getBoundingClientRect();

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

  GestureLock._getPosition = function(e, ratio) {
    const { left, top } = e.target.getBoundingClientRect();
    const { clientX, clientY } = e.touches[0];

    return {
      x: (clientX - left) * ratio,
      y: (clientY - top) * ratio
    }
  }

  GestureLock.prototype.init = function() {
    this.createCanvas();
    this.createCircle();
    this.initPassword();
    this.registerEventListener();
  }

  // create two canvas elements
  GestureLock.prototype.createCanvas = function() {
    const canvas = document.createElement('canvas');
 
    this.ele.style.position = 'relative';
    canvas.style.width = this.width + 'px';
    canvas.style.height = this.height + 'px';
    canvas.width = this.width * this.devicePixelRatio;
    canvas.height = this.height * this.devicePixelRatio;

    const canvas2 = canvas.cloneNode(canvas, true);
    canvas2.style.position = "absolute";
    canvas2.style.left = '0';
    canvas2.style.top = '0';

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas2 = canvas2;
    this.ctx2 = canvas2.getContext('2d');

    this.ele.appendChild(canvas);
    this.ele.appendChild(canvas2);
  }

  GestureLock.prototype.createCircle = function() {
    const n = this.type;
    const size = Math.min(this.canvas.width, this.canvas.height);
    const r = this.r = Math.floor(size / (n * 2 * 2 + 2));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const point = {
          x: (2 + 1) * r + 4 * r * j,
          y: (2 + 1) * r + 4 * r * i,
          r: r,
          id: `${i}${j}`,
        };
        this.circles.push(point);
        this.spareCircles.push(point);
      }
    }

    this.drawCircle();
  }

  GestureLock.prototype.drawCircle = function() {
    const { ctx, style } = this;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); //  先清空canvas
    this.circles.forEach(p => {
      GestureLock._drawCircle(ctx, p, {
        lineWidth: style.circleLineWidth,
        color: style.color
      })
    })
  }

  GestureLock.prototype.checkCurrentPoint = function(point) {
    const { x, y } = point;
    const { r } = this;

    const index = this.spareCircles.findIndex(c => Math.abs(c.x - x) < r && Math.abs(c.y - y) < r);

    if (index !== -1) {
      const circle = this.spareCircles.splice(index, 1)[0];
      this.touched = true;
      this.redraw = true;
      this.drawing = true;
      this.touchedCircles.push(circle);
    }
  }

  GestureLock.prototype.update = function(point) {
    const { ctx, ctx2, canvas2, touchedCircles, style, r } = this;
    const { length }= touchedCircles;
    const { lineWidth, lineColor, dotColor } = style;

    if (length >= 1) {
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);        // 清空画布, canvas2中画折线
      const { x, y } = touchedCircles[length - 1];
      if (Math.abs(point.x - x) > r || Math.abs(point.y - y) > r) {
        GestureLock._drawLine(ctx2, [touchedCircles[length - 1], point], {
          color: lineColor,
          lineWidth 
        })
      }
    }

    if (this.redraw) {
      this.redraw = false;
  
      if (length >= 1) {
        // 画下一个圆中的圆点
        const { x, y } = touchedCircles[length - 1]
        const touchedPoint = {
          x, 
          y, 
          r: r / 2
        }

        GestureLock._drawFilledCircle(ctx, touchedPoint, {
          color: dotColor
        })
      }

      if (length >= 2) {
        GestureLock._drawLine(ctx, [touchedCircles[length - 2], touchedCircles[length - 1]], {
          color: lineColor,
          lineWidth
        })  
      }
    }
  }

  GestureLock.prototype.reset = function() {
    this.drawCircle();
    this.ctx2.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
  }

  /* set and verify password */

  GestureLock.prototype.initPassword = function() {
    let model = undefined;
    const psdValue = w.localStorage.getItem('_HandLockPsd');

    model = psdValue ? 3 : 1;
    this.password = {
      model,
      value: JSON.parse(psdValue)
    }

    const msg = psdValue ? '请解锁' : '请绘制手势图案！';
    this.updateMessage({
      msg
    })
  }

  GestureLock.prototype.checkPassword = function() {
    const { model } = this.password;

    let success = false;
    switch (model) {
      case 1:
        success = this.setPassword();
        break;
      case 2:
        success = this.confirmPassword();
        break;
      case 3:
        success = this.verifyPassword();
      default:
        break;
    }

    const color = success ? '#2cff66' : '#f24e4e';
    const { ctx, ctx2, canvas2, style } = this;

    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    this.touchedCircles.forEach((p, i, arr) => {
      GestureLock._drawCircle(ctx, p, {
        lineWidth: style.circleLineWidth,
        color
      });

      const touchedPoint = {
        x: p.x,
        y: p.y,
        r: p.r / 2
      };

      GestureLock._drawFilledCircle(ctx, touchedPoint, {
        color: color
      });

      if (i > 0) {
        const p1 = arr[i - 1];
        GestureLock._drawLine(ctx2, [p1, p], {
          lineWidth: style.lineWidth,
          color
        })
      }
    })
  }

  // Model1: set password for the first time
  GestureLock.prototype.setPassword = function() {
    if (this.touchedCircles.length < 5) {
      this.updateMessage({
        msg: '密码长度不可少于5！',
        color: '#f24e4e'
      }, 1000, () => {
        this.updateMessage({
          msg: '请绘制手势图案！'
        })
      });
      return false;
    } else {
      this.password.tmp = [];
      this.touchedCircles.forEach(c => {
        this.password.tmp.push(c.id)
      });
      this.password.model = 2;
      this.updateMessage({
        msg: '请再次确定密码！'
      });
    }
    return true;
  }

  // Model2: confirm password by entering again
  GestureLock.prototype.confirmPassword = function() {
    const { touchedCircles, password } = this;
    let isEqual = true;

    if (touchedCircles.length !== password.tmp.length) {
      isEqual = false;
    } else {
      isEqual = !touchedCircles.some((c, i) => c.id !== password.tmp[i]);
    }

    if (!isEqual) {
      this.updateMessage({
        msg: '两次密码不一致，请重新设置！',
        color: '#f24e4e'
      }, 1000, () => {
        this.updateMessage({
          msg: '请绘制手势图案！',
        });
      });
      this.password.model = 1;
      return false;
    } else {
      w.localStorage.setItem('_HandLockPsd', JSON.stringify(password.tmp));
      this.password.model = 3;
      this.password.value = [...password.tmp];
      this.updateMessage({
        msg: '设置成功！',
        color: '#2cff66'
      }, 1000, () => {
        this.updateMessage({
          msg: '请解锁！'
        })
      });
    }
    return true;
  }

  // Model3: verify password finally
  GestureLock.prototype.verifyPassword = function() {
    const { touchedCircles, password } = this;
    let isEqual = true;

    if (touchedCircles.length !== password.value.length) {
      isEqual = false;
    } else {
      isEqual = !touchedCircles.some((c, i) => c.id !== password.value[i]);
    }

    if (!isEqual) {
      this.updateMessage({
        msg: '密码错误， 请再试一次！',
        color: '#f24e4e'
      });
      return false;
    } else {
      this.updateMessage({
        msg: '解锁成功！',
        color: '#2cff66',
      });
    }
    return true;
  }

  GestureLock.prototype.updateMessage = function({ msg, color = '#ffa726' }, delay, callback) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    const { messageEle } = this;
    messageEle.innerHTML = msg;
    messageEle.style.color = color;
    if (messageEle.style.opacity === '0') {
      messageEle.style.opacity = '1';
    }

    if (delay) {
      this.timer = setTimeout(() => {
        messageEle.style.opacity = '0';
        callback && callback();
      }, delay)
    }
  }

  GestureLock.prototype.registerEventListener = function() { 
    const { canvas2, devicePixelRatio } = this;

    canvas2.addEventListener('touchstart', (e) => {
      console.warn('touch start');
      e.preventDefault();

      if (!this.reseted) return;
      this.reseted = false;

      const curPoint = GestureLock._getPosition(e, devicePixelRatio);
      this.spareCircles = this.spareCircles.concat(this.touchedCircles.splice(0));
      this.checkCurrentPoint(curPoint);
    }, false);

    canvas2.addEventListener('touchmove', (e) => {
      console.warn('touch move');
      const curPoint = GestureLock._getPosition(e, devicePixelRatio);

      this.checkCurrentPoint(curPoint);
      if (this.touched) {
        this.update(curPoint);
      }
    }, false);

    canvas2.addEventListener('touchend', (e) => {
      console.warn('touch end');

      if (this.touched) {
        this.checkPassword();
        this.touched = false;
        this.spareCircles = this.spareCircles.concat(this.touchedCircles.splice(0));
        setTimeout(() => {
          this.reset();
          this.reseted = true;
        }, 400)
      }
    }, false);

    this.resetEle.addEventListener('click', (e) => {
      window.localStorage.removeItem('_HandLockPsd');
      this.password.model = 1;
      this.updateMessage({
        msg: '请绘制手势图案！',
      });
    })

  }

  w.GestureLock = GestureLock;
})(window)