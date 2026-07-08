/** Map */

import Button from "./Button";
import Config from "./Config";
import Text from "./Text";

class Map {
  constructor(props) {
    this._buttons = [];
    this._text = [];
    this._lines = [];

    // initial text
    this._title = new Text({
      text: 'VFP Magellanic',
      x: Config.centreX,
      y: Config.bottom - 32,
      hidden: true,
    });
    this._text.push(this._title);

    // module buttons
    const unit = Config.margin;
    const cx = Config.centreX;
    const cy = Config.centreY - unit * 0.25;
    const modules = [
      [ 'Cryo', 0, 2 ],
      [ 'Medical', 0, 1 ],
      [ 'Hub', 0, 0 ],
      [ 'Quarters 1', -1, 0 ],
      [ 'Greenhouse', -1, 1 ],
      [ 'Engineering', -2, 0 ],
      [ '7', 1, 0 ],
      [ '8', 1, 1 ],
      [ '9', 2, 0 ],
      [ '10', 0, -1 ],
      [ '11', -1, -1 ],
      [ 'Observatory', 1, -1 ],
      [ 'Command', 0, -2 ],
    ];
    modules.forEach((m, i) => {
      const text = new Text({
        text: m[0],
        x: Config.centreX,
        y: Config.bottom - 32,
        hidden: true,
      });
      const button = new Button({
        label: '',
        x: cx + m[1] * unit,
        y: cy + m[2] * unit,
        width: 32,
        height: 32,
        onClick: () => {
          this._text.forEach(t => t.hide());
          text.reveal();
        }
      });
      this._text.push( text );
      this._buttons.push( button );
    });

    // connector lines
    [
      [ 0, -2*unit, 0, 2*unit ],
      [ -2*unit, 0, 2*unit, 0],
      [ -1*unit, -1*unit, 1*unit, -1*unit ],
      [ -1*unit, 0, -1*unit, 1*unit ],
      [ 1*unit, -1*unit, 1*unit, 1*unit ]
    ].forEach(line => {
      this._lines.push(
        [ cx + line[0], cy + line[1], cx + line[2], cy + line[3] ]
      );
    });
  }

  /** reset */
  reset() {
    this._buttons.forEach(b => b.reset());
    this._text.forEach(t => t.reset());
    this._title.reveal();
  }

  /** click */
  click(x, y) {
    let active = false;
    this._buttons.forEach(b => {
      b.click(x, y);
      active = active || b.getActive();
    });
    if (!active) {
      this._text.forEach(t => t.hide());
      this._title.reveal();
    }
  }

  /** hover */
  hover(x, y) {
    this._buttons.forEach(b => b.hover(x, y));
  }

  /** draw */
  draw(ctx, delta) {
    // draw structure
    ctx.beginPath();
    this._lines.forEach(line => {
      ctx.moveTo(line[0], line[1]);
      ctx.lineTo(line[2], line[3]);
    });
    ctx.stroke();

    // draw buttons
    this._buttons.forEach(b => b.draw(ctx, delta));

    // draw text
    this._text.forEach(t => t.draw(ctx, delta));
  }
}

export default Map;