/** Room */

import { SceneNode, Carryable, CentrePivot, MapObjectByName, Hoverable, Prompt } from 'engine';
import * as THREE from 'three';
import Room from '../objects/Room';
import Ball from '../objects/Ball';
import Socket from '../objects/Socket';
import Door from '../objects/Door';
import SharedAssets from '../core/SharedAssets';
import { CreateInstancedMeshes } from '../util/CreateInstancedMeshes';
import ExtractMeshes from '../util/ExtractMeshes';

class Room_05 extends Room {
  constructor() {
    super({
      name: 'Room_05',
      position: new THREE.Vector3(-48, 0, 48),
      manifest: {
        doors: [
          [ [0, 2.125, 5.5], [0, 0, -1] ] // to airlock
        ],
        balls: [ [0, 0.25, 8] ],
      },
    });

    // extend state
    this.createState({
      ...this.getState(),
      wheel_1: 0,
      wheel_2: 0,
      wheel_3: 0,
      wheel_4: 0,
      wheel_5: 0,
      wheel_6: 0,
      wheel_7: 0,
      wheel_8: 0,
      wheel_9: 0,
      wheel_10: 0,
    });
  }

  /** init */
  _init() {
    super._init();

    // map object
    this._mapped = MapObjectByName( this._getCosmeticMap() );

    // create puzzle
    this._initPuzzle();

    // create instanced mesh
    const n1 = 8000;
    const n2 = 50;
    const leafMesh = ExtractMeshes( SharedAssets.requestAsset('foliage_leaf') )[0];
    const instanced = CreateInstancedMeshes( leafMesh, n1 + n2, null, false )[0];
    instanced.position.copy(this._position);

    // place instances
    const cosmetic = this._getCosmeticMap();
    let stems = cosmetic.getObjectByName('stems');
    let attr = stems.geometry.attributes;
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const helper = new THREE.Object3D();
    
    // leaves on stems
    for (let i=0; i<n1; i++) {
      const idx = Math.floor(Math.random() * attr.position.count) * 3;
      normal.set( attr.normal.array[idx], attr.normal.array[idx+1], attr.normal.array[idx+2] );
      const y = attr.position.array[idx+1];
      const offset = 0 + Math.random() * (0.2 + y / 20);
      position.set( 
        attr.position.array[idx] + normal.x * offset,
        y + normal.y * offset,
        attr.position.array[idx+2] + normal.z * offset
      );
      helper.position.copy( position );
      position.add( normal )
      helper.lookAt( position );
      helper.rotateOnAxis( normal, Math.random() * Math.PI * 2 );
      helper.scale.setScalar( 0.1 + Math.random() * 0.3 );
      helper.updateMatrix();
      instanced.setMatrixAt(i, helper.matrix);
    }

    // free floating leaves
    for (let i=0; i<n2; i++) {
      const theta = Math.PI * 2 * Math.random();
      const offset = Math.random() * 5;
      helper.position.set(Math.cos(theta) * offset, 4 + Math.random() * 11, Math.sin(theta) * offset);
      helper.rotation.set(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
      helper.scale.setScalar( 0.05 + Math.random() * 0.25 );
      helper.updateMatrix();
      instanced.setMatrixAt(n1 + i, helper.matrix);
    }

    // branches
    stems = cosmetic.getObjectByName('stems2');
    attr = stems.geometry.attributes;
    const n3 = 500;
    const branchMesh = ExtractMeshes( SharedAssets.requestAsset('foliage_branch') )[0];
    const instanced2 = CreateInstancedMeshes( branchMesh, n3, null, false )[0];
    instanced2.position.copy(this._position);

    // branches on stems
    for (let i=0; i<n3; i++) {
      const idx = Math.floor(Math.random() * attr.position.count) * 3;
      normal.set( attr.normal.array[idx], attr.normal.array[idx+1], attr.normal.array[idx+2] );
      const offset = 0 + Math.random() * 0.2;
      position.set( 
        attr.position.array[idx] + normal.x * offset,
        attr.position.array[idx+1] + normal.y * offset,
        attr.position.array[idx+2] + normal.z * offset
      );
      helper.position.copy( position );
      position.add( normal )
      helper.lookAt( position );
      helper.rotateOnAxis( normal, Math.random() * Math.PI * 2 );
      helper.scale.setScalar( 0.05 + Math.random() * 0.2 );
      helper.updateMatrix();
      instanced2.setMatrixAt(i, helper.matrix);
    }

    // ground foliage
    const gardenBed = cosmetic.getObjectByName('garden_bed');
    // gardenBed.visible = false;
    attr = gardenBed.geometry.attributes;
    const n4 = 2000;
    const foliageMesh = ExtractMeshes( SharedAssets.requestAsset('foliage_branch') )[0];
    const instanced3 = CreateInstancedMeshes( foliageMesh, n4, null, false )[0];
    instanced3.position.copy( this._position );

    for (let i=0; i<n4; i++) {
      const idx = Math.floor(Math.random() * attr.position.count) * 3;
      normal.set( attr.normal.array[idx], attr.normal.array[idx+1], attr.normal.array[idx+2] );
      const y = attr.position.array[idx+1];
      const offset = 0 + Math.random() * (0.2 + y / 20);
      position.set( 
        attr.position.array[idx] + normal.x * offset,
        y + normal.y * offset,
        attr.position.array[idx+2] + normal.z * offset
      );
      helper.position.copy( position );
      position.add( normal )
      helper.lookAt( position );
      helper.rotateOnAxis( normal, Math.random() * Math.PI * 2 );
      helper.scale.setScalar( 0.2 + Math.random() * 0.3 );
      helper.updateMatrix();
      instanced3.setMatrixAt(i, helper.matrix);
    }
    
    this._addToScene(instanced, instanced2, instanced3);
  }

  /** init puzzle */
  _initPuzzle() {
    // set puzzle positions
    const r1 = - Math.PI / 6;
    const offset = -4.75;
    this._mapped.pipes_1.position.set( Math.sin(r1) * offset, 1.75, Math.cos(r1) * offset );
    this._mapped.pipes_1.rotation.y = r1;
    const r2 = Math.PI * 1.375;
    this._mapped.pipes_2.position.set( -2.25, 1.5, -1 );
    this._mapped.pipes_2.rotation.y = r2;
    const r3 = Math.PI * 5/6;
    this._mapped.pipes_3.position.set( Math.sin(r3) * offset, 1.75, Math.cos(r3) * offset );
    this._mapped.pipes_3.rotation.y = r3;

    // utils
    const createPrompt = text => {
      destroyPrompt();
      this._prompt = new Prompt({
        name: this.name + '_Prompt',
        text: text,
      });
      this.add(this._prompt);
    };
    const destroyPrompt = () => {
      if (this._prompt) {
        this._prompt.destroy();
        this._prompt = null;
      }
    };
    const canInteract = () => {
      return ! this._locked && ! Carryable.currentTarget
    };

    // get wheels
    this._hoverableObjects = [];
    for (let i=0; i<10; i+=1) {
      const n = i + 1;
      const key = `wheel_${n}`;
      CentrePivot( this._mapped[key] );
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.25, 0.25), 
        SharedAssets.getWireframeMaterial(0x00FF00)
      );
      const hoverable = new Hoverable(mesh, {
        name: `${this.name}_${key}_hoverable`,
        radius: 2.5,
        onHover: () => {
          if ( ! canInteract() ) return;
          createPrompt( '[e] interact' );
        },
        onHoverEnd: () => {
          if ( ! canInteract() ) return;
          destroyPrompt();
        },
      });
      this.add(hoverable);
      this._mapped[key].add(mesh);
      this._hoverableObjects.push({ 
        mesh: this._mapped[key], hoverable, key, rotation: 0
      });
    }

    // keyboard event
    const listener = this._getSceneNode('UserInterface')
      .addEventListener('key', keyboard => {
        if (
          ! canInteract() || 
          ! keyboard.isKeyDown('e')
        ) return;
        this._hoverableObjects.forEach(object => {
          if (object.hoverable.isHover()) {
            destroyPrompt();
            this._onWheel( object.key );
          }
        });
      });
  }

  _afterInit() {}

  /** on wheel */
  _onWheel( name ) {
    if (this._locked) return;
    this._locked = true;
    this._hoverableObjects.forEach(obj => {
      obj.hoverable.disable();
    });

    // set state
    const next = this.getState(name) == 0 ? 1 : 0;
    this.setState({ [name]: next });

    setTimeout(() => {
      this._locked = false;
      this._hoverableObjects.forEach(obj => {
        obj.hoverable.enable();
      });
    }, 250);
  }

  /** on state changed */
  _onStateChanged( changed ) {
    const state = this.getState();

    // animate wheels
    this._hoverableObjects.forEach((obj, i) => {
      obj.rotation = state[obj.key] ? Math.PI : 0;
    });

    // set solution matrix
    if ( ! this._matrix ) {
      this._matrix = [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
      ];
    }
    this._matrix[0] = state.wheel_1 ^ state.wheel_7;
    this._matrix[1] = state.wheel_2 ^ state.wheel_4 ^ state.wheel_7;
    this._matrix[2] = state.wheel_2;
    this._matrix[3] = state.wheel_2 ^ state.wheel_9;
    this._matrix[4] = state.wheel_1 ^ state.wheel_6;
    this._matrix[5] = state.wheel_4 ^ state.wheel_7;
    this._matrix[6] = state.wheel_4 ^ state.wheel_8;
    this._matrix[7] = state.wheel_2 ^ state.wheel_4 ^ state.wheel_9;
    this._matrix[8] = state.wheel_1 ^ state.wheel_6 ^ state.wheel_10;
    this._matrix[9] = state.wheel_1 ^ state.wheel_5 ^ state.wheel_7;
    this._matrix[10] = state.wheel_1 ^ state.wheel_5 ^ state.wheel_8;
    this._matrix[11] = state.wheel_2 ^ state.wheel_5 ^ state.wheel_9;
    this._matrix[12] = state.wheel_3 ^ state.wheel_6;
    this._matrix[13] = state.wheel_3 ^ state.wheel_5 ^ state.wheel_7;
    this._matrix[14] = state.wheel_1 ^ state.wheel_8;
    this._matrix[15] = state.wheel_2 ^ state.wheel_9;

    // set indicator, get total
    let total = 0;
    this._matrix.forEach((x, i) => {
      const name = `indicator_${i}`;
      this._mapped[name].material = SharedAssets.getEmissiveMaterial(x ? 0x0000FF : 0x000022);
      total += x;
    });

    // check door
    this._map.Room_05_Door_1.setOpen(
      total === 5 &&
      this._matrix[0] &&
      this._matrix[6] &&
      this._matrix[7] &&
      this._matrix[10] &&
      this._matrix[12]
    );
  }

  /** update */
  _update(delta) {
    this._hoverableObjects.forEach(obj => {
      obj.mesh.rotation.z += (obj.rotation - obj.mesh.rotation.z) * 0.1;
    });
  }
}

export default Room_05;