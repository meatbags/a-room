/** Computer */

const margin = 64;
const size = 512;
const buttonHeight = 48;
const buttonWidth = 256;

class Screen {
  constructor(name) {
    this._name = name;
    this._lines = [];
    this._text = [];
    this._buttons = [];
    this._age = 0;
  }

  /** reset screen */
  reset() {
    this._age = 0;
    this._buttons.forEach(b => {
      b.active = false;
      b.hover = false;
    });
    this._text.forEach(t => {
      if (t.hidden) t.visible = false;
    });
  }

  /** get name */
  get name() {
    return this._name;
  }

  /** add text */
  addText(text, position, hidden=false) {
    this._text.push({
      text,
      position,
      size: null,
      hidden,
    })
  }

  /** add button */
  addButton(label, rect, onClick=null) {
    if ( ! rect.width ) {
      rect.width = buttonWidth;
      rect.height = buttonHeight;
    }
    rect.extent = { x: rect.width / 2, y: rect.height / 2 };
    this._buttons.push({ label, rect, onClick });
  }

  /** util: common back button */
  addBackButton(onClick) {
    this.addButton('<', {x: margin + 32, y: margin + 32, width: 48, height: 48 }, onClick);
  }

  /** util: map graphic */
  addMap() {
    // spacing
    const unit = margin;
    const cx = size/2;
    const cy = size/2 - unit * 0.25;

    // module buttons
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
      const hidden = true;
      this.addText(m[0], { x:size/2, y: size-margin*1.5 }, hidden);
      this.addButton(`${i+1}`, {
        x: cx + m[1] * unit,
        y: cy + m[2] * unit,
        width: 32,
        height: 32
      }, () => this.revealText(i));
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

  /** reveal text */
  revealText(index) {
    let i = 0;
    this._text.forEach((t) => {
      if (t.hidden) {
        t.visible = index === i;
        i += 1;
      }
    });
  }

  /** click */
  click(x, y) {
    this.revealText(-1);
    this._buttons.forEach(button => {
      if (button.hover) {
        button.active = true;
        if (button.onClick) {
          button.onClick();
        }
      } else {
        button.active = false;
      }
    });
  }

  /** hover */
  hover(x, y) {
    this._buttons.forEach(button => {
      button.hover = x >= button.rect.x - button.rect.extent.x && 
        x <= button.rect.x + button.rect.extent.x &&
        y >= button.rect.y - button.rect.extent.y &&
        y <= button.rect.y + button.rect.extent.y;
    });
  }

  /** draw screen */
  draw(ctx, delta) {
    // set styles
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // draw lines
    if (this._lines.length) {
      ctx.beginPath();
      this._lines.forEach(line => {
        ctx.moveTo(line[0], line[1]);
        ctx.lineTo(line[2], line[3]);
      });
      ctx.stroke();
    }

    // draw buttons 
    this._buttons.forEach(b => {
      const x = b.rect.x - b.rect.extent.x;
      const y = b.rect.y - b.rect.extent.y;
      const w = b.rect.width - 1;
      const h = b.rect.height - 1;
      const tmp = ctx.fillStyle;
      ctx.fillStyle = b.hover ? '#000088' : '#000';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = tmp;
      ctx.strokeRect(x, y, w, h);
      if (b.active) {
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        ctx.lineWidth = 1;
      }
      ctx.fillText(b.label, b.rect.x, b.rect.y);
    });

    // draw text
    this._text.forEach(t => {
      if ( t.visible === false) return;
      if ( ! t.size ) {
        t.size = ctx.measureText( t.text );
        // console.log(t.size);
      }
      ctx.fillText( t.text, t.position.x, t.position.y );
    });

    // wipe effect
    const wipe = 512 * 2.75;
    const start = margin + Math.floor(this._age * wipe);
    const needsDraw = start < size - margin;
    if (needsDraw) {
      ctx.clearRect(0, start, size, size - start);
      const tmp = ctx.fillStyle;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(margin, start, size-margin*2, 6);
      ctx.fillStyle = tmp;
    }

    // draw bounds
    ctx.strokeRect(margin, margin, size-margin*2, size-margin*2);

    // increment age
    this._age += delta;

    return needsDraw;
  }
}

class Computer {
  constructor( root ) {
    this._root = root;
    this._cursor = { x: -1, y: -1 };
    this._screens = [];
    this._currentScreen = null;

    // spacing
    let cx = size / 2;
    let title = margin * 1.75;
    let cy = title + ((size - margin) - title) / 2;

    // create screens
    const home = new Screen('home');
    home.addText('MAGELLANIC INTRANET', {x: cx, y: title});
    home.addButton('PERSONAL LOG IN', {x: cx, y: cy - margin}, () => this._openScreen('login'));
    home.addButton('STATION MAP', {x: cx, y: cy}, () => this._openScreen('map'));
    home.addButton('PUBLIC DATA', {x: cx, y: cy + margin}, () => this._openScreen('data'));

    const login = new Screen('login');
    login.addBackButton( () => this._openScreen('home') );
    login.addText('SELECT ACCOUNT', {x:cx, y: title});
    let bw = buttonWidth;
    let bh = 32;
    ['BOHM', 'HARI', 'KELVIN', 'KOLODNY', 'RIJNDAEL', 'SOROKIN', 'TAO'].forEach((name, i) => {
      login.addButton(name, {
        x: cx, 
        y: cy + (-3 + i) * (bh + 6),
        width: bw,
        height: bh
      },
      null);
    });

    const map = new Screen('map');
    map.addBackButton( () => this._openScreen('home') );
    map.addMap();

    const data = new Screen('data');
    data.addBackButton( () => this._openScreen('home') );

    this._screens.push(home, login, map, data);
  
    // open home
    this._openScreen('home');
  }

  /** go to screen */
  _openScreen(name) {
    const screen = this._screens.find(s => s.name === name);
    this._currentScreen = screen;
    this._currentScreen.reset();
  }

  /** click */
  click(x, y) {
    if (this._currentScreen) {
      this._currentScreen.click(x, y);
    }
  }

  /** hover */
  hover(x, y) {
    this._cursor.x = x;
    this._cursor.y = y;
    if (this._currentScreen) {
      this._currentScreen.hover(x, y);
    }
  }

  /** draw cursor */
  drawCursor(ctx) {
    /*
    ctx.beginPath();
    ctx.arc(this._cursor.x, this._cursor.y, 10, 0, Math.PI*2);
    ctx.moveTo(0, this._cursor.y);
    ctx.lineTo(margin, this._cursor.y);
    ctx.moveTo(size, this._cursor.y);
    ctx.lineTo(size - margin, this._cursor.y);
    ctx.moveTo(this._cursor.x, 0);
    ctx.lineTo(this._cursor.x, margin);
    ctx.moveTo(this._cursor.x, size);
    ctx.lineTo(this._cursor.x, size - margin);
    ctx.stroke();
    */
    ctx.fillRect( this._cursor.x - 12, this._cursor.y, 25, 2 );
    ctx.fillRect( this._cursor.x, this._cursor.y - 12, 2, 25 );
  }

  /** draw */
  draw(ctx, delta) {
    let needDraw = false;

    // draw screen
    if (this._currentScreen) {
      needDraw = this._currentScreen.draw( ctx, delta );
    }

    // draw cursor
    this.drawCursor( ctx );

    return needDraw;
  }
}

export default Computer;