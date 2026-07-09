/** Screen */

import Config from "./Config";
import Scrollbar from "./Scrollbar";

class Screen {
  constructor(name) {
    this.name = name;
    this._age = 0;
    this._elements = [];
    this._scrollbar = new Scrollbar();
  }

  /** add element */
  add(element) {
    this._elements.push(element);
    
    // check height
    let y = 0;
    this._elements.forEach(e => {
      if (typeof e.getBottom === 'function') {
        y = Math.max(y, e.getBottom());
      }
    });
    this._scrollbar.setMax(y + Config.margin / 2);
  }

  /** reset screen */
  reset() {
    this._age = 0;
    this._elements.forEach(e => {
      if (typeof e.reset === 'function') {
        e.reset();
      }
    });
    this._scrollbar.reset();
  }

  /** click */
  click(x, y) {
    this._elements.forEach(e => {
      if (typeof e.click === 'function') {
        e.click(x, y + this._scrollbar.scroll, this._scrollbar.scroll);
      }
    });
    this._scrollbar.click(x, y);
  }

  /** hover */
  hover(x, y) {
    this._elements.forEach(e => {
      if (typeof e.hover === 'function') {
        e.hover(x, y + this._scrollbar.scroll, this._scrollbar.scroll);
      }
    });
    this._scrollbar.hover(x, y);
  }

  /** pointer down */
  pointerDown(x, y) {
    this._elements.forEach(e => {
      if (typeof e.pointerDown === 'function') {
        e.pointerDown(x, y + this._scrollbar.scroll);
      }
    });
    this._scrollbar.pointerDown(x, y);
  }

  /** pointer up */
  pointerUp() {
    this._elements.forEach(e => {
      if (typeof e.pointerUp === 'function') {
        e.pointerUp();
      }
    });
    this._scrollbar.pointerUp();
  }

  /** wheel */
  wheel(evt) {
    this._elements.forEach(e => {
      if (typeof e.wheel === 'function') {
        e.wheel(evt);
      }
    });
    this._scrollbar.wheel(evt);
  }

  /** draw screen */
  draw(ctx, delta) {
    // set styles
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.font = '40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // scroll
    if (this._scrollbar) {
      ctx.translate(0, -this._scrollbar.scroll);
    }

    // draw elements
    let needsDraw = false;
    this._elements.forEach(e => {
      if (typeof e.draw === 'function') {
        needsDraw = e.draw( ctx, delta ) || needsDraw;
      }
    });

    // reset transform
    if (this._scrollbar) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // draw scrollbar
    if (this._scrollbar) {
      needsDraw = this._scrollbar.draw(ctx, delta) || needsDraw;
    }

    // 
    const start = Config.top + Math.floor(this._age * Config.wipeSpeed);
    needsDraw = needsDraw || start < Config.bottom;
    if (needsDraw) {
      ctx.clearRect(0, start, Config.size, Config.size - start);
      const tmp = ctx.fillStyle;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(Config.left, start, Config.innerWidth, 6);
      ctx.fillStyle = tmp;
    }

    // increment age
    this._age += delta;
    
    return needsDraw;
  }
}

export default Screen;