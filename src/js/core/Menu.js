/** Menu */

import { GetRoot, SceneNode } from 'engine';
import * as THREE from 'three';
import MenuAnimation from './MenuAnimation';

export default class Menu extends SceneNode {
  constructor() {
    super({ name: 'MainMenu' });

    // root
    const root = GetRoot();

    // menu animation
    root.getModule('MainLoop').add(new MenuAnimation());

    // create menu screens
    const overlay = root.getModule('Overlay');
    overlay.createScreen('home', {
      title: 'magellanic',
      buttons: {
        'continue': () => {
          const menu = document.querySelector('.engine__menu');
          if (menu) {
            menu.dataset.pauseScreen = 1;
          }
          root.resumeGame();
        },
        'controls': () => overlay.openScreen('controls'),
        'credits': () => overlay.openScreen('credits'),
      },
    });
    overlay.createScreen('controls', {
      title: 'controls',
      content: `
        pan camera ~ <span>mouse</span><br>
        move ~ <span>wsad</span> or <span>arrow keys</span><br>
        sprint ~ <span>hold shift</span><br>
        exit to menu ~ <span>esc</span>
      `,
      buttons: {
        '&larr; back': () => overlay.openScreen('home'),
      }
    });
    overlay.createScreen('credits', {
      title: 'credits',
      content: `[ credits ]`,
      buttons: {
        '&larr; back': () => overlay.openScreen('home'),
      }
    });
  }
}
