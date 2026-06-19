/** LOD */

import { GetRoot } from 'engine';

class LOD {
  constructor(position) {
    this._position = position;
    this.levels = [];
    GetRoot().getSceneNode('Camera').addEventListener('move', p => {
      this.update(p);
    });
  }

  /** add level */
  addLevel( object, distance ) {
    this.levels.push({ object, distanceSquared: distance * distance });
    this.levels.sort((a,b) => a.distanceSquared - b.distanceSquared);
    this.levels.forEach((level, i) => {
      level.min = i == 0 ? 0 : level.distanceSquared;
      level.max = i == this.levels.length-1 ? Infinity : this.levels[i+1].distanceSquared;
    });
  }

  /** update LODs */
  update(p) {
    const d = this._position.distanceToSquared(p);
    let found = false;
    this.levels.forEach(level => {
      if (!found && d >= level.min && d <= level.max) {
        level.object.visible = true;
        found = true;
      } else {
        level.object.visible = false;
      }
    });
  }
}

export default LOD;