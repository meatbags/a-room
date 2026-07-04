/** Ball */

import { SceneNode, MapObjectByName } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import SharedAssets from '../core/SharedAssets';

class Terminal extends SceneNode {
  static RADIUS = 2.5;
  static RADIUS_SQUARED = 5.125;
  static SCREEN_SIZE = 512;
  
  constructor(props={}) {
    super({ name: props.name ?? 'Terminal' });
    
    // props
    this.isTerminal = true;
    this._position = props.position || new THREE.Vector3();
    this._rotation = props.rotation || 0;
    const pitch = Math.PI/6;
    const up = new THREE.Vector3(0, 1, 0);
    this._normal = new THREE.Vector3(
      Math.cos(pitch), Math.sin(pitch), 0
    ).applyAxisAngle(up, this._rotation);
    this._active = true;
    this._canInteract = false;
    this._tmp = new THREE.Vector3();
  }

  /** initialise */
  _init() {
    // set up mesh
    const asset = SharedAssets.requestAsset('terminal');
    this._group = new THREE.Group();
    ExtractMeshes( asset ).forEach(mesh => {
      mesh.castShadow = true;
      this._group.add(mesh);
    })
    this._group.position.copy(this._position);
    this._group.rotation.y = this._rotation;

    // get screen
    const mapped = MapObjectByName( this._group );
    this._screen = mapped.terminal_screen ?? null;
    if (!this._screen) {
      console.warn( 'No screen mesh found', this._group );
    }
    const canvas = new OffscreenCanvas(Terminal.SCREEN_SIZE, Terminal.SCREEN_SIZE);
    this._context = canvas.getContext('2d');
    this._screenTexture = new THREE.CanvasTexture( canvas );
    this._screen.material = new THREE.MeshPhysicalMaterial({
      color: 0x000022,
      emissive: 0xFFFFFF,
      emissiveMap: this._screenTexture,
      emissiveIntensity: 1,
      metalness: 0.4,
      roughness: 0.05,
    });

    // cursor functionality
    this._rayCaster = new THREE.Raycaster(
      new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 0, Terminal.RADIUS_SQUARED);
    this._cursor = new THREE.Vector2(Terminal.SCREEN_SIZE/2, Terminal.SCREEN_SIZE/2);
    this._plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.55), 
      new THREE.MeshBasicMaterial({ color: 0x00FF00 })
    );
    this._plane.lookAt(this._normal);
    this._plane.position.set(0, 1.3125, 0)
      .add( this._normal.clone().multiplyScalar(.225) )
      .add( this._position );
    this._plane.visible = false;
    this._addToScene(this._plane);

    // events
    this._refCamera = SceneNode.getSceneNode('Camera');
    this._refCamera.addEventListener('move', p => this._onCameraMove(p));
    this._refCamera.addEventListener('pan', () => this._onCameraPan());

    // draw initial
    this._draw();

    // add
    this._addToScene(this._group);
  }

  /** on camera move event */
  _onCameraMove(p) {
    if (!this._active) return;
    this._canInteract = this._plane.position.distanceToSquared(p) < Terminal.RADIUS_SQUARED &&
      this._normal.dot( this._tmp.copy(p).sub(this._plane.position) ) > 0;
  }

  /** on camera pan */
  _onCameraPan() {
    if (!this._active || !this._canInteract) return;

    // intersect screen
    this._rayCaster.ray.origin.copy( this._refCamera.getCamera().position );
    this._refCamera.getWorldDirection( this._rayCaster.ray.direction );
    const intersect = this._rayCaster.intersectObject( this._plane );

    if (!intersect.length) return;

    // set cursor from plane uv
    this._cursor.set(
      intersect[0].uv.x,
      1 - intersect[0].uv.y
    );

    // update screen
    this._draw();
  }

  /** get canvas context */
  get context() {
    return this._context;
  }

  /** turn on  */
  activate() {
    this._active = true;
  }

  /** turn off */
  deactivate() {
    this._active = false;
  }

  _draw() {
    // reset
    this._context.clearRect(0, 0, Terminal.SCREEN_SIZE, Terminal.SCREEN_SIZE);
    this._context.fillStyle = '#FFFFFF';
    this._context.font = '24px monospace';

    // text
    const placeholder = [
      'POWER: RATION',
      'CONTAINMENT: EMERGENCY',
      'HULL: CRITICAL',
      'GRAVITY: EMERGENCY',
      'CREW: UNKNOWN',
    ];
    placeholder.forEach((row, i) => {
      this._context.fillText(row, 48, 48 + 32*(i+1));
    });

    // cursor
    const x = Math.round(this._cursor.x * Terminal.SCREEN_SIZE);
    const y = Math.round(this._cursor.y * Terminal.SCREEN_SIZE);
    this._context.fillRect(x-16, y-16, 32, 32);

    // needs update
    this._screenTexture.needsUpdate = true;
  }
}

export default Terminal;