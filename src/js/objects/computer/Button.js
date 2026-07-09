/** Button */

import Config from "./Config";

class Button {
  constructor(props) {
    // props
    this.text = props.text ?? '';
    this.x = props.x ?? 0;
    this.y = props.y ?? 0;
    this.width = props.width ?? Config.buttonWidth;
    this.height = props.height ?? Config.buttonHeight;
    this.extentX = this.width / 2;
    this.extentY = this.height / 2;
    this.onHover = props.onHover ?? null;
    this.onHoverEnd = props.onHoverEnd ?? null;
    this.onClick = props.onClick ?? null;
    this.fixed = props.fixed ?? false;
    
    // internal state
    this._hover = false;
    this._active = false;
  }

  /** reset */
  reset() {
    this._hover = false;
    this._active = false;
  }

  /** click */
  click(x, y, scroll) {
    this.hover(x, y, scroll);
    if (this._hover) {
      this._active = true;
      if (this.onClick) {
        this.onClick();
      }
    } else {
      this._active = false;
    }
  }

  /** hover */
  hover(x, y, scroll) {
    const yOffset = this.fixed ? scroll : 0;
    const hover = x >= this.x - this.extentX &&
      y >= this.y - this.extentY + yOffset &&
      x <= this.x + this.extentX &&
      y <= this.y + this.extentY + yOffset;
    if (hover !== this._hover) {
      this._hover = hover;
      if (this._hover && this.onHover) {
        this.onHover();
      } else if (!this._hover && this.onHoverEnd) {
        this.onHoverEnd();
      }
    }
  }

  /** draw */
  draw(ctx, delta) {
    const transform = this.fixed ? ctx.getTransform() : null;
    if (transform) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const x = this.x - this.extentX;
    const y = this.y - this.extentY;
    const w = this.width - 1;
    const h = this.height - 1;
    const tmp = ctx.fillStyle;
    ctx.fillStyle = this._hover 
      ? Config.buttonHoverColour : Config.backgroundColour;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = tmp;
    ctx.strokeRect(x, y, w, h);
    if (this._active) {
      ctx.lineWidth = 4;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.lineWidth = 1;
    }
    ctx.fillText(this.text, this.x, this.y);
    if (transform) {
      ctx.setTransform(transform);
    }
    return false;
  }

  /** get bottom */
  getBottom() {
    return this.y + this.extentY;
  }

  /** get hover */
  getHover() {
    return this._hover
  };

  /** get active */
  getActive() {
    return this._active;
  }

  /** util: common back button */
  static createBackButton( onClick=null ) {
    return new Button({
      text: '←',
      x: Config.left + Config.margin / 2,
      y: Config.top + Config.margin / 2,
      width: Config.margin / 2,
      height: Config.margin / 2,
      fixed: true,
      onClick: onClick,
    });
  }
}

export default Button;