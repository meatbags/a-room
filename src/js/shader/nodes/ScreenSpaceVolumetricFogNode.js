/** ScreenSpaceVolumetricFogNode */

import { HalfFloatType, Vector2, TempNode, RenderTarget, QuadMesh, NodeMaterial, RendererUtils, Storage3DTexture, RepeatWrapping } from 'three/webgpu';
import {
  abs, 
  Break, 
  cameraPosition, clamp, color, cos,
  dot, 
  float, floor, fract, Fn, 
  getViewPosition,
  instanceIndex, interleavedGradientNoise, If,
  length, logarithmicDepthToViewZ, Loop,
  mx_noise_vec3, min, max,
  normalize, NodeUpdateType, 
  passTexture, PI, pow,
  reference, rand,
  sub, sin, smoothstep, 
  texture3D, textureStore, time, triNoise3D,
  uniform, uv, vec2, vec3, vec4,
  varying, viewZToPerspectiveDepth
} from 'three/tsl';

const _quadMesh = new QuadMesh();
const _size = new Vector2();
let _rendererState;

class ScreenSpaceVolumetricFogNode extends TempNode {
  static get type() {
    return 'ScreenSpaceVolumetricFogNode';
  }

  constructor( depthNode, camera ) {
    super('vec4');

    // nodes
    this.depthNode = depthNode;
    this.updateBeforeType = NodeUpdateType.FRAME;

    // camera refs
    this._camera = camera;
    this._cameraNear = reference( 'near', 'float', camera );
    this._cameraFar = reference( 'far', 'float', camera );
    this._cameraProjectionMatrix = uniform( camera.projectionMatrix );
		this._cameraProjectionMatrixInverse = uniform( camera.projectionMatrixInverse );
    this._cameraWorldMatrix = uniform( camera.matrixWorld );
    this._cameraWorldMatrixInverse = uniform( camera.matrixWorldInverse );

    // render props
    this._resolution = uniform( new Vector2() );
    this._ssvfRenderTarget = new RenderTarget( 1, 1, { depthBuffer: false, type: HalfFloatType } );
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

    // do cloud compute
    renderer.compute( this.computeNode );

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

  /** setup compute texture node */
  setupComputeTexture({size=50, timeScale=1, positionScale=0.125}) {
    const sizeHalf = size / 2;

    // compute cloud node
    const computeCloud = Fn( ([ storageTexture ]) => {
      const id = instanceIndex;
      const x = id.mod( size ).toVar();
      const y = id.div( size ).mod( size ).toVar();
      const z = id.div( size * size ).toVar();
      const samp = vec3( x, y, z ).toVar();
      const centered = samp.sub( sizeHalf ).div( size ).toVar(); // [-0.5, 0.5]   
      const yFactor = centered.y.add(0.5).toVar(); // [0, 1]
      const d = float( 1.0 ).sub( centered.length() ).toVar();
      const noiseCoord = samp.mul( positionScale )
        .mul( yFactor.mul(3).add(1) )
        .add( time.mul( timeScale ) );
      const noise = mx_noise_vec3(noiseCoord).mul(d).mul(d).toVar();
      textureStore( storageTexture, vec3( x, y, z ), vec4( vec3(noise.x), 1.0 ));
    });

    // storage texture node
    this.storageTexture = new Storage3DTexture(size, size, size);
    this.storageTexture.generateMipmaps = false;
    this.computeNode = computeCloud(this.storageTexture).compute(size * size * size);
  }

  /** setup fog node */
  setupFogNode() {
    // fog settings
    const FOG_START = 10;
    const FOG_STOP = 100;
    const FOG_DISTANCE_MULTIPLIER = 20;
    const FOG_HEIGHT = 50;
    const FOG_ALPHA = 0.25;
    const fogDiffuse = color( 0xFF0000 ).toVar();    

    // ray marcher
    const MAX_ITERATIONS = 100;
    const RAY_STEP_MIN = 0.05;
    const Raymarch = ( rayOrigin, rayDirection, rayMin, rayMax, steps, callback ) => {
      const rayDir = rayDirection.normalize().toVar();
      const start = rayMin.toVar();
      const stop = min(rayMax, length(rayDirection)).toVar()
      const delta = max(RAY_STEP_MIN, stop.sub(start).abs().div(steps)).toVar();
      const rayOffset = mx_noise_vec3( rayOrigin.add(rayDirection).mul(100) ).fract().mul(delta).toVar();
      start.addAssign( rayOffset );
      const positionRay = vec3( rayOrigin.add( start.mul( rayDir ) ) ).toVar();
      const distanceTravelled = rayOffset.toVar();
      const iter = float(0).toVar();
      
      Loop( { type: 'float', start: start, end: stop, update: delta }, () => {
        // do callback
        callback( {
          positionRay,
          distanceTravelled
        });

        // update ray, check done
        positionRay.addAssign( rayDir.mul( delta ) );
        distanceTravelled.addAssign( delta );
        iter.addAssign(1);
        If( iter.greaterThanEqual(MAX_ITERATIONS), () => {
          Break();
        });
      });
    };

    // volumetric fog node
    const VolumetricFog = Fn(({
      rayOrigin,
      rayDirection,
      texture,
      range = float( 0.1 ),
      threshold = float( 0.25 ),
      opacity = float( 0.25 ),
      steps = float( 64 ),
      alphaCutoff = float( 0.95 ),
      textureScale = float( 1 ),
      fadeRange = float( 0.5 ),
      fadeStart = float( 1 ),
      fadeStop = float( 10 ),
    }) => {
      const finalColor = vec4( 0 ).toVar();
      const kn = vec3(-0.05).toConst();
      const kp = vec3(0.05).toConst();
      const rmin = threshold.sub(range).toVar();
      const rmax = threshold.add(range).toVar();
      const rayMin = max(0, fadeStart.sub(fadeRange)).toVar();
      const rayMax = fadeStop;
    
      Raymarch( rayOrigin, rayDirection, rayMin, rayMax, steps, ( { positionRay, distanceTravelled } ) => {
        const samp = positionRay.div( textureScale ).mod(1).toVar();
        const mapValue = smoothstep(rmin, rmax, texture.sample(samp).r)
          .mul( opacity )
          .mul( fadeStart.sub(distanceTravelled).div( fadeRange ).saturate().oneMinus() )
          .mul( distanceTravelled.sub( fadeStop ).div( fadeRange ).saturate().oneMinus() )
          .toVar();
        const shading = texture.sample( samp.add(kn).mod(1) ).r
          .sub( texture.sample( samp.add(kp).mod(1) ).r );
        const col = shading.mul(4.0).add(samp.x.add(samp.y).mul(0.5)).add(0.3);
        finalColor.rgb.addAssign( finalColor.a.oneMinus().mul( mapValue ).mul( col ) );
        finalColor.a.addAssign( finalColor.a.oneMinus().mul( mapValue ) );
        If( finalColor.a.greaterThanEqual( alphaCutoff ), () => {
          finalColor.assign( finalColor.saturate() );
          Break();
        } );
      } );
      
      return finalColor;
    });

    // fog volumetric
    const uniformThreshold = uniform( 0.1 ); 
    const uniformOpacity = uniform( 0.5 );
    const uniformRange = uniform( 0.1 );
    const uniformSteps = uniform( 50 );
    const uniformAlphaCutoff = uniform( 0.95 );
    const uniformTextureScale = uniform( 6.0 );
    const uniformTexture3D = texture3D( this.storageTexture, null, 0 );

    const rayOrigin = varying( cameraPosition );

    // p = world position
    this.fogNode = Fn(([ p ]) => {
      const rayDirection = p.sub( rayOrigin );
      const fogRange = length( rayDirection ).negate().smoothstep(FOG_START, FOG_STOP).toVar();
      const distance = fogRange.mul(FOG_DISTANCE_MULTIPLIER).max(FOG_HEIGHT).toVar();
      const fogHeightFactor = float(distance).sub( p.y ).div(distance).pow(3).saturate().mul(FOG_ALPHA);
      const fogNoiseA = triNoise3D( p.mul( .005 ), 0.2, time );
      const fogNoiseB = triNoise3D( p.mul( .01 ), 0.2, time.mul( 1.2 ) );
      const fogSurfaceNoise = fogNoiseA.add( fogNoiseB );
      const fogVolumetric =  VolumetricFog( {
        rayOrigin,
        rayDirection,
        texture: uniformTexture3D,
        range: uniformRange,
        threshold: uniformThreshold,
        opacity: uniformOpacity,
        steps: uniformSteps,
        alphaCutoff: uniformAlphaCutoff,
        textureScale: uniformTextureScale,
      } );

      return fogRange.oneMinus()
        .mix( color( 0x0000FF ), fogSurfaceNoise )
        .add( fogVolumetric )
        .mul( fogHeightFactor );
    });
  }

  /** setup */
  setup( builder ) {
    const uvNode = uv();
    
    // setup 3d texture
    this.setupComputeTexture({});
    builder.renderer.compute( this.computeNode );

    // setup fog node
    this.setupFogNode();

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
      const output = vec3().toVar();

      // get world position from depth
      const depth = sampleDepth( uvNode ).toVar();

      // infinite
      If( depth.greaterThanEqual( 1.0 ), () => {
        output.addAssign( vec3(0.0, 0.1, 0.0) );
      }).Else(() => {
        const viewPosition = getViewPosition( uvNode, depth, this._cameraProjectionMatrixInverse ).toVar();
        const worldPosition = this._cameraWorldMatrix.mul(viewPosition).toVar();
        output.addAssign( this.fogNode( worldPosition ) );
      });

      return output;
    });
    
    // set material frag shader
    this._material.fragmentNode = ssvf().context( builder.getSharedContext() );
		this._material.needsUpdate = true;

    return this._textureNode;
  }

  /** dispose */
  dispose() {
    this._ssvfRenderTarget.dispose();
		this._material.dispose();
	}
}

export const ssvf = (depthNode, camera) => {
  return new ScreenSpaceVolumetricFogNode(depthNode, camera);
};