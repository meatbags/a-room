/** Screen */

import Config from "./Config";
import Scrollbar from "./Scrollbar";
import Screen from "./Screen";
import Text from "./Text";
import Button from "./Button";

class PinScreen extends Screen {
  constructor(props, onSolve) {
    super(props.name);

    // on solve callback
    this.users = props.users;
    this.onSolve = onSolve;

    // internals
    this._user = null;
    this._showHint = false;
    this._configuration = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // create buttons
    this._buttonColour = '#fff';
    this._buttons = [];
    const cx = Config.centreX;
    const cy = Config.centreY - Config.margin * 0.25;
    const unit = 32;
    const k = [ [0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2] ];
    k.forEach((p, i) => {
      const button = new Button({
        label: '', 
        x: cx + p[0] * unit, 
        y: cy + p[1] * unit,
        width: unit,
        height: unit,
        onClick: () => {
          this._configuration[i] = this._configuration[i] === 0 ? 1 : 0;
        },
      })
      this.add( button );
      this._buttons.push( button );
    });
    this._submitButton = new Button({
      text: 'SUBMIT',
      x: Config.centreX - 80,
      y: Config.centreY + 4 * unit,
      width: 128,
      onClick: () => {
        this._checkAnswer();
      }
    });
    this._clearButton = new Button({
      text: 'X',
      x: Config.centreX + 32,
      y: Config.centreY + 4 * unit,
      width: 64,
      onClick: () => {
        this._configuration = this._configuration.map(x => 0);
      }
    });
    this._hintButton = new Button({
      text: '?',
      x: Config.centreX + 112,
      y: Config.centreY + 4 * unit,
      width: 64,
      onClick: () => {
        this._showHint = ! this._showHint;
      }
    });

    // text
    this._title = new Text({ text: '[]', x: Config.centreX, y: Config.top + Config.margin * 0.75 });
    this._hint = new Text({ text: '', x: Config.centreX, y: cy, background: true });

    // add elements
    this.add( this._submitButton );
    this.add( this._clearButton );
    this.add( this._hintButton );
    this.add( this._title );
  }

  /** reset */
  reset() {
    super.reset();
    this._configuration = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this._showHint = false;
  }

  /** init logic */
  setLogin( username ) {
    this._user = username;
    this._title.text = `[ user: ${username} ]`;
    const settings = this.users[ username ];
    if (!settings) {
      console.warn('User not found', username);
    }
    this._hint.text = settings.hint ?? 'Not found.';
    this._solution = [];
    for (let i=0; i<13; i++) {
      this._solution.push( (settings.password >> (12 - i)) & 1 );
    }
  }

  /** click */
  click(x, y, scroll) {
    super.click(x, y, scroll);

    // check active
    if ( ! this._submitButton.getActive() ) {
      this._buttonColour = '#fff';
    }
    if ( ! this._hintButton.getActive() ) {
      this._showHint = false;
    }
  }

  /** check answer */
  _checkAnswer() {
    if (!this._solution) return;
    let correct = true;
    this._solution.forEach((x, i) => {
      if (this._configuration[i] !== x) {
        correct = false;
      }
    });
    this._buttonColour = correct ? '#00FF00' : '#FF0000';
    if (correct) {
      setTimeout(() => {
        this.onSolve( this._user );
      }, 250);
    }
  }

  /** draw */
  draw(ctx, delta) {
    let needsDraw = super.draw(ctx, delta);

    // draw current configuration
    const tmp = ctx.fillStyle;
    ctx.fillStyle = this._buttonColour;
    this._buttons.forEach((button, i) => {
      if (this._configuration[i]) {
        ctx.fillRect(button.x-button.extentX, button.y - button.extentY, button.width-1, button.height-1);
        ctx.strokeRect(button.x-button.extentX, button.y - button.extentY, button.width-1, button.height-1);
      }
    });

    // reset
    ctx.fillStyle = tmp;

    // draw hint
    if (this._showHint) {
      this._hint.draw(ctx, delta);
    }

    return needsDraw;
  }
}

export default PinScreen;