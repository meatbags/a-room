/** ScreenSpaceVolumetricFogNode */

import { Vector2, TempNode, RenderTarget, QuadMesh, NodeMaterial, RendererUtils } from 'three/webgpu';
import { clamp, normalize, reference, Fn, NodeUpdateType, uniform, vec4, passTexture, uv, logarithmicDepthToViewZ, viewZToPerspectiveDepth, getViewPosition, screenCoordinate, float, sub, fract, dot, vec2, rand, vec3, Loop, mul, PI, cos, sin, uint, cross, acos, sign, pow, luminance, If, max, abs, Break, sqrt, HALF_PI, div, ceil, shiftRight, convertToTexture, bool, getNormalFromDepth, countOneBits, interleavedGradientNoise } from 'three/tsl';

const _quadMesh = new QuadMesh();
const _size = new Vector2();
let _rendererState;

class ScreenSpaceVolumetricFogNode extends TempNode {
  static get type() {
    return 'ScreenSpaceVolumetricFogNode';
  }

  constructor( inputNode, depthNode, camera ) {
    super('vec4');

    // nodes
    this.inputNode = inputNode;
    this.depthNode = depthNode;
    this.updateBeforeType = NodeUpdateType.FRAME;

    // camera refs
    this._camera = camera;
    this._cameraNear = reference( 'near', 'float', camera );
    this._cameraFar = reference( 'far', 'float', camera );
    this._cameraProjectionMatrix = uniform( camera.projectionMatrix );
		this._cameraProjectionMatrixInverse = uniform( camera.projectionMatrixInverse );

    // render props
    this._resolution = uniform( new Vector2() );
    this._ssvfRenderTarget = new RenderTarget( 1, 1, { depthBuffer: false } );
    this._ssvfRenderTarget.texture.name = 'SSVF';
    this._material = new NodeMaterial();
		this._material.name = 'SSVF';
    this._textureNode = passTexture( this, this._ssvfRenderTarget.texture );
  }

  /** get texture node */
  getTextureNode() {
		return this._textureNode;
	}

  /** set size */
  setSize( width, height ) {
    this._resolution.value.set( width, height );
		this._ssvfRenderTarget.setSize( width, height );
  }

  /** update */
  updateBefore( frame ) {
    const { renderer } = frame;

    // save
		_rendererState = RendererUtils.resetRendererState( renderer, _rendererState );
		
    // set size
    const size = renderer.getDrawingBufferSize( _size );
		this.setSize( size.width, size.height );
		_quadMesh.material = this._material;
		_quadMesh.name = 'SSVF';

		// clear
		renderer.setClearColor( 0x000000, 1 );

		// ssvf
		renderer.setRenderTarget( this._ssvfRenderTarget );
		_quadMesh.render( renderer );

		// restore
		RendererUtils.restoreRendererState( renderer, _rendererState );
  }

  /** setup */
  setup( builder ) {
    const uvNode = uv();
    
    // get depth
    const sampleDepth = (uv) => {
      const depth = this.depthNode.sample( uv ).r;
			if ( builder.renderer.logarithmicDepthBuffer === true ) {
				const viewZ = logarithmicDepthToViewZ( depth, this._cameraNear, this._cameraFar );
				return viewZToPerspectiveDepth( viewZ, this._cameraNear, this._cameraFar );
			}
			return depth;
    };

    // ssvf
    const ssvf = Fn(() => {
      // get world position from depth
      const depth = sampleDepth( uvNode ).toVar();
      depth.greaterThanEqual( 1.0 ).discard();
      const viewPosition = getViewPosition( uvNode, depth, this._cameraProjectionMatrixInverse ).toVar();

      return this.inputNode;
    });
    
    // set material frag shader
    this._material.fragmentNode = ssvf().context( builder.getSharedContext() );
		this._material.needsUpdate = true;

    return this.inputNode.add(vec4(0.1, 0, 0, 0));
  }

  /** dispose */
  dispose() {
    this._ssvfRenderTarget.dispose();
		this._material.dispose();
	}
}

export const ssvf = (inputNode, depthNode, camera) => {
  return new ScreenSpaceVolumetricFogNode(inputNode, depthNode, camera);
};