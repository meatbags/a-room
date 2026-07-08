/** Computer */

import Screen from './Screen';
import PinScreen from './PinScreen';
import Button from './Button';
import Text from './Text';
import Map from './Map';
import Config from './Config';

class Computer {
  constructor( root ) {
    this._root = root;
    this._cursor = { x: -1, y: -1 };
    this._screens = [];
    this._currentScreen = null;

    // spacing
    let title = Config.top + Config.margin * 0.75;

    // home screen
    const home = new Screen('home');
    home.add( new Text({ text: '[ MAGELLANIC INTRANET ]', x: Config.centreX, y: title }));
    home.add( new Button({ label: 'SIGN IN', x: Config.centreX, y: title + Config.margin * 1.5, onClick: () => this._openScreen('login') }) );
    home.add( new Button({ label: 'STATION MAP', x: Config.centreX, y: title + Config.margin * 2.5, onClick: () => this._openScreen('map') }) );
    home.add( new Button({ label: 'LOGS', x: Config.centreX, y: title + Config.margin * 3.5, onClick: () => this._openScreen('logs') }) );

    // login/user screens
    const userScreens = [];
    const login = new Screen('login');
    login.add( new Text({ text: '[ SELECT ACCOUNT ]', x: Config.centreX, y: title }));
    ['BOHM', 'HARI', 'KELVIN', 'KOLODNY', 'RIJNDAEL', 'SOROKIN', 'TAO'].forEach((name, i) => {
      // add login button
      login.add(
        new Button({
          label: name,
          x: Config.centreX,
          y: title + (i + 1) * Config.margin,
          onClick: () => {
            pin.setLogin( name );
            this._openScreen('pin');
          }
        })
      );

      // add user screen
      const screen = new Screen(`user_${ name.toLowerCase() }`);
      screen.add( new Text({ text: `[ WELCOME: ${name} ]`, x: Config.centreX, y: title }));
      screen.add( Button.createBackButton(() => this._openScreen('login') ));
      userScreens.push(screen);
    });
    login.add( Button.createBackButton(() => this._openScreen('home')) );

    // pin screen
    const pin = new PinScreen('pin', user => {
      this._openScreen(`user_${user.toLowerCase()}`);
      this._root.needsDraw = true;
    });
    pin.add( Button.createBackButton(() => this._openScreen('login') ));

    // map screen
    const map = new Screen('map');
    map.add( Button.createBackButton(() => this._openScreen('home')) );
    map.add( new Map() );

    // data screen
    const logs = new Screen('logs');
    logs.add( new Text({ text: '[ LOGS ]', x: Config.centreX, y: title }));
    const logsWidth = Config.characterWidth * 26;
    const logsRows = [
      'VFP MAGELLANIC',
      '-------+------------------',
      'MFR    | ACX HEAVY INDS',
      'CLASS  | Catalan',
      'REG    | 513793/CTA',
      'GT     | 19,000',
      'COSPAR | 2096-638C',
      '-------+------------------',
      '',
      'CREW MANIFEST',
      '--------------------------',
      'POSITION   | NAME',
      '-----------+--------------',
      'Captain    | D. BOHM ',
      'Pilot      | R. KOLODNY',
      'Engineer   | C. KELVIN',
      'Engineer   | T. TAO ',
      'Biologist  | N. HARI ',
      'Medical    | J. RIJNDAEL',
      'Navigator  | V. SOROKIN',
      '-----------+--------------',
    ];
    logs.add( new Text({
      x: 80,
      y: title + Config.margin,
      width: logsWidth,
      height: logsRows.length * Config.lineHeight,
      rows: logsRows,
    }));
    logs.add( Button.createBackButton(() => this._openScreen('home')) );

    // add screens
    this._screens.push(home, login, pin, map, logs, ...userScreens);
  
    // open home
    this._openScreen('user_bohm');
  }

  /** go to screen */
  _openScreen(name) {
    const screen = this._screens.find(s => s.name === name);
    if (!screen) {
      console.warn('Screen not found:', name);
    }
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

  /** pointer down */
  pointerDown(x, y) {
    if (this._currentScreen) {
      this._currentScreen.pointerDown(x, y);
    }
  }

  /** pointer up */
  pointerUp() {
    if (this._currentScreen) {
      this._currentScreen.pointerUp();
    }
  }

  /** wheel */
  wheel(e) {
    if (this._currentScreen) {
      this._currentScreen.wheel(e);
    }
  }

  /** draw cursor */
  drawCursor(ctx) {
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

    // draw cursor, screen bounds
    this.drawCursor( ctx );
    ctx.clearRect(0, 0, Config.size, Config.margin);
    ctx.clearRect(0, Config.bottom, Config.size, Config.margin);
    ctx.clearRect(0, 0, Config.margin, Config.size);
    ctx.clearRect(Config.right, 0, Config.margin, Config.size);
    ctx.strokeRect(Config.left, Config.top, Config.innerWidth, Config.innerHeight);

    return needDraw;
  }
}

export default Computer;