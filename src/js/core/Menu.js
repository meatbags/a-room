/** Menu */

import { GetRoot, SceneNode } from 'engine';

export default class Menu extends SceneNode {
  constructor() {
    super({ name: 'MainMenu' });

    const root = GetRoot();

    // create menu screens
    const overlay = root.getModule('Overlay');
    overlay.createScreen('home', {
      title: 'ruins',
      buttons: {
        'continue': () => root.resumeGame()
      },
    });
  }
}
