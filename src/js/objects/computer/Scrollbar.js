/** Scrollbar */

import Button from "./Button";
import Config from "./Config";

class Scrollbar {
  constructor() {
    // props
    this.max = 0;
    this.scroll = 0;
    this.scrollMax = 0;
    this.scrollSpeed = 15;

    // elements
    this.buttons = [
      new Button({label: '', x:Config.right-16, y:Config.top+16, width:32, height:32, onClick: () => {}}),
      new Button({label: '', x:Config.right-16, y:Config.bottom-16, width:32, height:32, onClick: () => {}})
    ];

    // internal
    this._active = false;
  }

  /** reset button */
  reset() {
    this.scroll = 0;
    this.buttons.forEach(button => button.reset());
  }

  /** set scrollmax */
  setMax(max) {
    this.max = max;
    this.scrollMax = Math.max(0, this.max - Config.bottom);
    this._active = this.scrollMax > 0;
  }

  /** click */
  click(x, y) {
    this.buttons.forEach(button => button.click(x, y));
  }

  /** hover */
  hover(x, y) {
    this.buttons.forEach(button => button.hover(x, y));
  }

  /** pointer down */
  pointerDown(x, y) {
    this._pointerDown = true;
  }

  /** pointer up */
  pointerUp() {
    if ( ! this._pointerDown ) return;
    this._pointerDown = false;
  }
  
  /** wheel */
  wheel(evt) {
    const dir = evt.deltaY > 0 ? 1 : evt.deltaY < 0 ? -1 : 0;
    this.scroll = Math.max(0, Math.min(this.scrollMax,  this.scroll + this.scrollSpeed * dir));
  }

  /** draw button */
  draw(ctx, delta) {
    if (!this._active) {
      return;
    }

    // update scroll
    let needsDraw = false;
    if (this._pointerDown) {
      if (this.buttons[0].getHover()) {
        const next = Math.max(0, this.scroll - this.scrollSpeed);
        needsDraw = this.scroll !== next;
        this.scroll = next;
      } else if (this.buttons[1].getHover()) {
        const next = Math.min(this.scrollMax, this.scroll + this.scrollSpeed);
        needsDraw = this.scroll !== next;
        this.scroll = next;
      }
    }

    // draw buttons
    this.buttons.forEach(button => button.draw(ctx, delta));

    // draw scrollbar
    ctx.beginPath();
    ctx.moveTo(Config.right - 32, Config.top);
    ctx.lineTo(Config.right - 32, Config.bottom);
    ctx.moveTo(Config.right - 16 - 8, Config.top + 16 + 4);
    ctx.lineTo(Config.right - 16, Config.top + 16 - 4);
    ctx.lineTo(Config.right - 16 + 8, Config.top + 16 + 4);
    ctx.moveTo(Config.right - 16 - 8, Config.bottom - 16 - 4);
    ctx.lineTo(Config.right - 16, Config.bottom - 16 + 4);
    ctx.lineTo(Config.right - 16 + 8, Config.bottom - 16 - 4);
    const barTop = Config.top + 32 + 16;
    const barBottom = Config.bottom - 32 - 16;
    const barRange = barBottom - barTop;
    const barSize = Config.innerHeight / (Config.innerHeight + this.scrollMax) * (barRange);
    const barOffset = this.scroll / this.scrollMax * (barRange - barSize);
    ctx.moveTo(Config.right - 16, barTop + barOffset );
    ctx.lineTo(Config.right - 16, barTop + barOffset + barSize );
    ctx.stroke();

    return needsDraw;
  }
}

export default Scrollbar;