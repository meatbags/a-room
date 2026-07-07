/** Menu */

import { GetRoot, SceneNode, Element } from 'engine';
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
        'reset demo': () => {
          localStorage.clear();
          window.location.reload();
        },
      },
    });
    overlay.createScreen('controls', {
      title: 'controls',
      content: `
        interact ~ <span>e</span><br>
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
      content: `a game by Xavier Burrow`,
      buttons: {
        '&larr; back': () => overlay.openScreen('home'),
      }
    });

    // loading screen
    this._loadingScreen = root.getModule('LoadingScreen');
    this._loadingScreen.setHTML('loading');

    // progress element
    this._progress = Element({
      class: 'custom-progress',
      children: [{
        class: 'custom-progress__text',
        innerText: 'initialising...',
      }],
    });
    const target = this._progress.querySelector('.custom-progress__text');
    const callback = t => target.innerText = `fetching assets... ${Math.round(t * 100)}%`;

    // load events
    root.getModule('LoadingScreen').addCustomProgressBar(this._progress, callback);
    root.addEventListener('load', () => { target.innerText = 'compiling shaders...'; } );
    root.addEventListener('precompile', () => {
      setTimeout(() => {
        target.innerText = 'initialising world...';
      }, 150);
    });
    root.getModule('MainLoop').addEventListener('ready', () => {
      target.innerText = 'ready';
      setTimeout(() => {
        this._progress.dataset.ready = 1;
      }, 250);
    });
  }
}
