/** Screen */

import Config from "./Config";
import Scrollbar from "./Scrollbar";
import Screen from "./Screen";
import Text from "./Text";
import Button from "./Button";

class PinScreen extends Screen {
  constructor(name, onSolve) {
    super(name);

    // on solve callback
    this.onSolve = onSolve;

    // internals
    this._user = null;
    this._manifest = {
      hint: {
        bohm: 'bohm hint',
        hari: 'hari hint',
        kelvin: 'kelvin hint',
        kolodny: 'kolodny hint',
        rijndael: 'rijndael hint',
        sorokin: 'sorokin hint',
        tao: 'tao hint',
      },
      solution: {
        bohm: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
        hari: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        kelvin: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        kolodny: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        rijndael: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        sorokin: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        tao: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    };
    this._showHint = false;
    this._configuration = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // create buttons
    this._buttonColour = '#fff';
    this._buttons = [];
    const cx = Config.centreX;
    const cy = Config.centreY - Config.margin * 0.25;
    const unit = 32;
    const k = [
      [0, -2],
      [-1, -1], [0, -1], [1, -1],
      [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
      [-1, 1], [0, 1], [1, 1],
      [0, 2],
    ];
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
      label: 'SUBMIT',
      x: Config.centreX - 80,
      y: Config.centreY + 4 * unit,
      width: 128,
      onClick: () => {
        this._checkAnswer();
      }
    });
    this._clearButton = new Button({
      label: 'X',
      x: Config.centreX + 32,
      y: Config.centreY + 4 * unit,
      width: 64,
      onClick: () => {
        this._configuration = this._configuration.map(x => 0);
      }
    });
    this._hintButton = new Button({
      label: '?',
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
  setLogin(name) {
    this._user = name;
    this._title.text = `[ user: ${name} ]`;
    const key = name.toLowerCase();
    this._hint.text = this._manifest.hint[key] ?? 'Not found.';
    this._solution = this._manifest.solution[key] ?? null;
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