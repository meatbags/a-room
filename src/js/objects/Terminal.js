/** Terminal */

import { SceneNode, MapObjectByName } from 'engine';
import * as THREE from 'three';
import ExtractMeshes from '../util/ExtractMeshes';
import SharedAssets from '../core/SharedAssets';
import Computer from './Computer';

class Terminal extends SceneNode {
  static RADIUS = 2.5;
  static RADIUS_SQUARED = 5.125;
  static SCREEN_SIZE = 512;
  static PLANE_VERTICAL_OFFSET = 0.3125;
  static PLANE_NORMAL_OFFSET = 0.225;
  
  constructor(props={}) {
    super({ name: props.name ?? 'Terminal' });
    
    // props
    this.isTerminal = true;
    this._position = props.position || new THREE.Vector3();
    this._rotation = props.rotation || 0;
    const pitch = Math.PI / 6;
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
    // initialise computer
    this._initComputer();

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
      SharedAssets.getWireframeMaterial( 0x00FF00 ),
    );
    this._plane.lookAt(this._normal);
    this._plane.position.set(0, Terminal.PLANE_VERTICAL_OFFSET, 0)
      .add( this._normal.clone().multiplyScalar( Terminal.PLANE_NORMAL_OFFSET ) )
      .add( this._position );
    this._plane.visible = true;
    this._addToScene(this._plane);

    // events
    this._refCamera = SceneNode.getSceneNode('Camera');
    this._refCamera.addEventListener('move', p => this._onCameraMove(p));
    this._refCamera.addEventListener('pan', () => this._onCameraPan());
    SceneNode.getSceneNode('UserInterface').addEventListener('click', controls => {
      this._onClick(controls);
    });

    // add
    this._addToScene(this._group);
  }

  /** initialise computer internals */
  _initComputer() {
    this._pc = new Computer( this );
  }

  /** on camera move event */
  _onCameraMove(p) {
    if (!this._active) return;
    this._canInteract = this._plane.position.distanceToSquared(p) < Terminal.RADIUS_SQUARED &&
      this._normal.dot( this._tmp.copy(p).sub(this._plane.position) ) > 0;
    this._onCameraPan();
  }

  /** get screen intersect */
  _getScreenIntersect() {
    this._rayCaster.ray.origin.copy( this._refCamera.getCamera().position );
    this._refCamera.getWorldDirection( this._rayCaster.ray.direction );
    return this._rayCaster.intersectObject( this._plane );
  }

  /** on camera pan */
  _onCameraPan() {
    if (!this._active || !this._canInteract) return;

    // intersect screen
    const intersect = this._getScreenIntersect();
    if (!intersect.length) return;

    // set cursor from plane uv, hover
    this._cursor.set( intersect[0].uv.x, 1 - intersect[0].uv.y );
    this._pc.hover(
      Math.floor(this._cursor.x * Terminal.SCREEN_SIZE ),
      Math.floor(this._cursor.y * Terminal.SCREEN_SIZE )
    );

    // update screen
    this._needsDraw = true;
  }

  _onClick(controls) {
    if (!this._active || !this._canInteract) return;

    // intersect screen
    const intersect = this._getScreenIntersect();
    if (!intersect.length) return;

    // click
    this._pc.click(
      Math.floor(this._cursor.x * Terminal.SCREEN_SIZE ),
      Math.floor(this._cursor.y * Terminal.SCREEN_SIZE )
    );

    this._needsDraw = true;
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

  update(delta) {
    if (this._needsDraw) {
      this._context.clearRect(0, 0, Terminal.SCREEN_SIZE, Terminal.SCREEN_SIZE);
      this._needsDraw = this._pc.draw(this._context, delta);
      this._screenTexture.needsUpdate = true;
    }
  }
}

export default Terminal;