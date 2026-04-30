/** App */

import { CreateRoot } from 'engine';
import Config from './config/Config';
import Menu from './core/Menu';
import Graphics from './core/Graphics';
import Game from './core/Game';

class App {
  constructor() {
    const root = CreateRoot('#app', Config);

    // add top level modules
    root.addModule(new Menu());
    root.addModule(new Graphics());

    // add scenes
    root.addScene(Game);

    // run
    root.run();
  }
}

export default App;
