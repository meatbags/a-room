/** App */

import { CreateRoot } from 'engine';
import Config from './config/Config';
import Dev from './core/Dev';
import Menu from './core/Menu';
import Graphics from './core/Graphics';
import Game from './core/Game';

class App {
  constructor() {
    const root = CreateRoot('#app', Config);

    // add top level modules
    root.addModule(new Menu());
    root.addModule(new Graphics());
    root.addModule(new Dev());

    // add scenes
    root.addScene(Game);

    // run
    root.run();
  }
}

export default App;
