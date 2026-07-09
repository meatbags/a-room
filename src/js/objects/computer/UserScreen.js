/** Screen */

import Config from "./Config";
import Scrollbar from "./Scrollbar";
import Screen from "./Screen";
import Text from "./Text";
import Button from "./Button";

class UserScreen extends Screen {
  constructor(props) {
    super(props.name);

    // internals
    this._user = null;
    this._currentScreen = null;
    this._topLevelScreen = true;
    this._screens = {};

    // create sub-screens
    for (const user in props.users) {
      const screens = {};
      const top = Config.top + Config.margin * 0.75;
      screens.home = new Screen('home');
      screens.home.add( new Text({
        text: `[ access: ${user} ]`,
        x: Config.centreX,
        y: top
      }) );
      let buttonIndex = 0;
      const conf = props.users[user] || {};
      const month = {'01': 'JAN', '02': 'FEB', '03': 'MAR', '04': 'APR', '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AUG', '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DEC' };

      // add messages
      if (conf.messages) {
        screens.messages = new Screen('messages');
        screens.messages.add( new Text({ text: `[ inbox ]`, x: Config.centreX, y: top }) );

        // message screens
        const width = Config.characterWidth * 26;
        screens.messages.add( new Text({
          x: Config.margin + 16,
          y: top + Config.margin * 0.75,
          width: width,
          rows: [
            ' FROM     SUBJECT   DATE',
          ],
        }) );
        conf.messages.forEach((message, i) => {
          const key = `message_${i}`;

          // message
          const screen = new Screen(key);
          screen.add( new Text({
            x: Config.margin + 16,
            y: top + Config.margin * 0.5,
            width: width,
            rows: [
              `DATE: ${message.date}`,
              `FROM: ${message.from}`,
              `SUBJECT: ${message.subject}`,
              'MESSAGE_BODY:',
              '',
              ...message.rows,
            ],
          }) );

          // back button
          screen.add( Button.createBackButton(() => this._openScreen('messages')) );

          // open message button
          const from = message.from.substr(0, 8).padEnd(8, ' ');
          const subject = message.subject.substr(0, 9).padEnd(9, ' ');
          const tmp = message.date.split(' ')[0].split('-');
          const dateShort = tmp[2] + ' ' + month[tmp[1]];
          screens.messages.add( new Button({
            text: from + ' ' + subject + ' ' + dateShort,
            x: Config.centreX,
            y: top + (i + 1.5) * Config.margin,
            width: Config.innerWidth - 32,
            onClick: () => this._openScreen(key),
          }) );

          // add screen
          screens[key] = screen;
        });

        // back button
        screens.messages.add( Button.createBackButton(() => this._openScreen('home')) );
        
        // open messages
        screens.home.add(new Button({
          text: 'messages', 
          x: Config.centreX,
          y: Config.top + (buttonIndex + 1.75) * Config.margin,
          onClick: () => this._openScreen('messages')
        }));

        buttonIndex += 1;
      }

      // add logs
      if (conf.logs) {
        screens.logs = new Screen('logs');
        screens.logs.add( new Text({ text: `[ personal logs ]`, x: Config.centreX, y: top }) );

        // log screens
        const width = Config.characterWidth * 26;
        screens.logs.add( new Text({
          x: Config.margin + 16,
          y: top + Config.margin * 0.75,
          width: width,
          rows: [
            ' DATE       SUBJECT',
          ],
        }) );
        conf.logs.forEach((log, i) => {
          const key = `log_${i}`;

          // message
          const screen = new Screen(key);
          screen.add( new Text({
            x: Config.margin + 16,
            y: top + Config.margin * 0.5,
            width: width,
            rows: [
              `DATE: ${log.date}`,
              `SUBJECT: ${log.subject}`,
              'LOG_BODY:',
              '',
              ...log.rows,
            ],
          }) );

          // back button
          screen.add( Button.createBackButton(() => this._openScreen('logs')) );

          // open log
          const date = log.date.split(' ')[0];
          const subject = log.subject.substr(0, 14).padEnd(14, ' ');
          screens.logs.add( new Button({
            text: date + ' ' + subject,
            x: Config.centreX,
            y: top + (i + 1.5) * Config.margin,
            width: Config.innerWidth - 32,
            onClick: () => this._openScreen(key),
          }) );

          // add screen
          screens[key] = screen;
        });

        // back button
        screens.logs.add( Button.createBackButton(() => this._openScreen('home')) );

        // open logs
        screens.home.add(new Button({
          text: 'personal logs', 
          x: Config.centreX,
          y: Config.top + (buttonIndex + 1.75) * Config.margin,
          onClick: () => this._openScreen('logs')
        }));

        buttonIndex += 1;
      }

      this._screens[user] = screens;
    }
  }

  /** reset */
  reset() {
    super.reset();
    for (const user in this._screens) {
      Object.values( this._screens[user] ).forEach(s => s.reset());
    }
  }

  /** set user logic */
  setUser( username ) {
    this._user = username;
    this._openScreen('home');
  }

  /** open screen */
  _openScreen( name ) {
    this._currentScreen = this._screens[ this._user ][ name ];
    this._topLevelScreen = name === 'home';
    this._currentScreen.reset();
  }

  /** click */
  click(x, y) {
    if (this._topLevelScreen) {
      super.click(x, y);
    }
    this._currentScreen.click(x, y);
  }

  /** hover */
  hover(x, y) {
    if (this._topLevelScreen) {
      super.hover(x, y);
    }
    this._currentScreen.hover(x, y);
  }

  /** pointer down */
  pointerDown(x, y) {
    if (this._topLevelScreen) {
      super.pointerDown(x, y);
    }
    this._currentScreen.pointerDown(x, y);
  }

  /** pointer up */
  pointerUp() {
    if (this._topLevelScreen) {
      super.pointerUp();
    }
    this._currentScreen.pointerUp();
  }

  /** wheel */
  wheel(evt) {
    if (this._topLevelScreen) {
      super.wheel(evt);
    }
    this._currentScreen.wheel(evt);
  }

  /** draw */
  draw(ctx, delta) {
    // draw user screen
    let needsUpdate = this._currentScreen.draw(ctx, delta);

    // draw top-level screen
    if (this._topLevelScreen) {
      needsUpdate = super.draw(ctx, delta) || needsUpdate;
    }

    return needsUpdate;
  }
}

export default UserScreen;