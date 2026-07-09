/** Computer */

import Screen from './Screen';
import PinScreen from './PinScreen';
import UserScreen from './UserScreen';
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

    // create screens
    Config.manifest.screens.forEach(conf => {
      // create screen
      let screen = null;
      if (conf.type === undefined) {
        screen = new Screen(conf.name);
      } else if (conf.type === 'pinScreen') {
        screen = new PinScreen(conf, username => {
          const user = this._screens.find(s => s.name === 'user');
          user.setUser(username);
          this._openScreen('user');
          this._root.needsDraw = true;
        });
      } else if (conf.type === 'userScreen') {
        screen = new UserScreen(conf);
      }
      
      // create elements
      (conf.elements ?? []).forEach(e => {
        if (e.type === 'text') {
          screen.add( new Text({ ...e }) );
        } else if (e.type === 'button') {
          screen.add( new Button({
            ...e,
            onClick: () => {
              if (!e.onClick) return;

              // open screen
              if (e.onClick.screen) {
                this._openScreen(e.onClick.screen);

              // open pin screen
              } else if (e.onClick.pin) {
                const pin = this._screens.find(s => s.name === 'pin');
                pin.setLogin(e.onClick.pin);
                this._openScreen('pin');
              }
            }
          }))
        } else if (e.type === 'map') {
          screen.add( new Map({ ...e }) );
        }
      });

      // add back button
      if (conf.parent) {
        screen.add(
          Button.createBackButton(() => this._openScreen(conf.parent))
        );
      }

      // add screen
      this._screens.push(screen);
    });

    const user = this._screens.find(s => s.name === 'user');
    user.setUser('hari');
    this._openScreen('user');
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