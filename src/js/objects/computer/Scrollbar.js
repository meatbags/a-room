/** Scrollbar */

import Button from "./Button";
import Config from "./Config";

class Scrollbar {
  constructor() {
    // props
    this.max = 0;
    this.scroll = 0;
    this.scrollMax = 0;
    this.scrollSpeed = Config.margin / 4;

    // elements
    const size = Config.margin / 2;
    const spacing = Config.margin / 4;
    this.buttons = [
      new Button({label: '', x:Config.right-spacing, y:Config.top+spacing, width:size, height:size, onClick: () => {}}),
      new Button({label: '', x:Config.right-spacing, y:Config.bottom-spacing, width:size, height:size, onClick: () => {}})
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
    const size = Config.margin / 2;
    const spacing = Config.margin / 4;
    ctx.beginPath();
    ctx.moveTo(Config.right - size, Config.top);
    ctx.lineTo(Config.right - size, Config.bottom);
    ctx.moveTo(Config.right - spacing * 1.5, Config.top + spacing * 1.25);
    ctx.lineTo(Config.right - spacing, Config.top + spacing * 0.75);
    ctx.lineTo(Config.right + spacing * 1.5, Config.top + spacing * 1.25);
    ctx.moveTo(Config.right - spacing * 0.5, Config.bottom - spacing * 0.75);
    ctx.lineTo(Config.right - spacing, Config.bottom - spacing * 1.25);
    ctx.lineTo(Config.right + spacing * 0.5, Config.bottom - spacing * 0.75);
    const barTop = Config.top + size + spacing;
    const barBottom = Config.bottom - size - spacing;
    const barRange = barBottom - barTop;
    const barSize = Config.innerHeight / (Config.innerHeight + this.scrollMax) * (barRange);
    const barOffset = this.scroll / this.scrollMax * (barRange - barSize);
    ctx.moveTo(Config.right - spacing, barTop + barOffset );
    ctx.lineTo(Config.right - spacing, barTop + barOffset + barSize );
    ctx.stroke();

    return needsDraw;
  }
}

export default Scrollbar;