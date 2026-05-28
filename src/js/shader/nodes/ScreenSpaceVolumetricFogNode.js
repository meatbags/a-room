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
  uniform, uv, vec2, vec3, vec4, uint,
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
    this._cameraPosition = uniform( camera.position );
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
  setupComputeTexture({size=50, timeScale=1, positionScale=0.1}) {
    const sizeHalf = size / 2;

    // compute cloud node
    const computeCloud = Fn( ([ storageTexture ]) => {
      const id = instanceIndex;
      const x = id.mod( size ).toVar();
      const y = id.div( size ).mod( size ).toVar();
      const z = id.div( size * size ).toVar();
      const samp = vec3( x, y, z ).toVar();
      const centered = samp.sub( sizeHalf ).div( size ).toVar(); // [-0.5, 0.5]   
      //const yFactor = centered.y.add(0.5).toVar(); // [0, 1]
      const d = float( 1.0 ).sub( centered.length() ).toVar();
      const noiseCoord = samp.mul( positionScale )
        //.mul( yFactor.mul(3).add(1) )
        .add( time.mul( timeScale ) );
      const noise = mx_noise_vec3(noiseCoord).mul(d).mul(d).toVar();
      textureStore( storageTexture, vec3( x, y, z ), vec4( vec3(noise.x), 1.0 ));
    });

    // storage texture node
    this.storageTexture = new Storage3DTexture(size, size, size);
    this.storageTexture.generateMipmaps = false;
    this.storageTexture.wrapS = RepeatWrapping;
    this.storageTexture.wrapT = RepeatWrapping;
    this.computeNode = computeCloud(this.storageTexture).compute(size * size * size);
  }

  /** setup fog node */
  setupFogNode() {
    // fog settings
    const FOG_START = 1;
    const FOG_STOP = 50;
    const FOG_DISTANCE_MULTIPLIER = 20;
    const FOG_HEIGHT = 100;
    const FOG_ALPHA = 0.75;

    const RAY_MAX_ITERATIONS = 75;
    const RAY_STEP_MIN = 0.035;
    const RAY_STEP_MAX = 0.095;
    const RAY_OFFSET_NOISE_SEED_SCALE = 90;
    
    const VOLUME_THRESHOLD = 0.09;
    const VOLUME_OPACITY = 0.05;
    const VOLUME_RANGE = 0.05;
    const VOLUME_STEPS = 25;
    const VOLUME_ALPHA_CUTOFF = 0.75;
    const VOLUME_TEXTURE_SCALE = 5.0;
    const VOLUME_START = 2;
    const VOLUME_STOP = 10;
    const VOLUME_PADDING = 1;
    
    const VOLUME_FIXED_STEP = 0.3;
    const VOLUME_MAX_RANDOM_OFFSET = 0.3;

    const INFLUENCE_FOG_NOISE = 0.1;
    const INFLUENCE_VOLUMETRIC = 0.1;

    // ray marching node
    const Raymarch = ( worldPosition, rayOrigin, rayDirection, rayMin, rayMax, raySteps, callback ) => {
      // iteration
      // const stop = min( rayMax, length(rayDirection) ).toVar();
      const stop = length( rayDirection ).toVar();
      const start = min( rayMin, stop ).toVar();
      const step = float( VOLUME_FIXED_STEP ).toVar();
      //const step = (stop.sub(start).abs().div(raySteps)).clamp(RAY_STEP_MIN, RAY_STEP_MAX).toVar();

      // normalized direction
      const rayDir = rayDirection.normalize().toVar();
      const rayStep = rayDir.mul(step).toVar();

      // add some noise to start position
      const offset = rand( rayDirection.xy ).fract().mul( VOLUME_MAX_RANDOM_OFFSET ).toVar();
      // const offset = mx_noise_vec3( rayDirection.xyz.mul( 100 ) ).mul( VOLUME_MAX_RANDOM_OFFSET ).abs().toVar();
      start.addAssign( offset );

      // trackers
      const positionRay = rayOrigin.add(rayDir.mul(start)).toVar();
      const distanceTravelled = float(0).toVar();
      const iterations = float(0).toVar();

      // loop
      const count = uint( stop.sub(start).div(step) );
      Loop(count, () => {
        // do callback
        callback( {
          positionRay,
          distanceTravelled
        });

        // update ray, check done
        positionRay.addAssign( rayStep );
        distanceTravelled.addAssign( step );

        // limit iterations
        iterations.addAssign(1);
        If( iterations.greaterThanEqual(RAY_MAX_ITERATIONS), () => {
          Break();
        });
      });
    };

    // volumetric fog node
    const VolumetricFog = Fn(({
      worldPosition,
      rayOrigin,
      rayDirection,
      texture,
      range = float( 0.1 ),
      threshold = float( 0.25 ),
      opacity = float( 0.25 ),
      steps = float( 64 ),
      alphaCutoff = float( 0.95 ),
      textureScale = float( 1 ),
      fadeStart = float( 0 ),
      fadeStop = float( 10 ),
      fadePadding = float( 1 ),
    }) => {
      const finalColor = vec4( 0 ).toVar();
      const kn = vec3(-0.02).toConst();
      const kp = vec3(0.02).toConst();
      const rmin = threshold.sub(range).toVar();
      const rmax = threshold.add(range).toVar();
      const rayMin = fadeStart.toVar();
      const rayMax = fadeStop.toVar();
      const rayPad = max( 0.001, fadePadding ).toVar();
    
      Raymarch( worldPosition, rayOrigin, rayDirection, rayMin, rayMax, steps, ( { positionRay, distanceTravelled } ) => {
        const samp = positionRay.div( textureScale ).mod(1).toVar();
        const mapValue = smoothstep(rmin, rmax, texture.sample(samp).r)
          .mul( opacity )
          .mul( distanceTravelled.sub( rayMin ).div( rayPad ).saturate() )
          .mul( distanceTravelled.sub( rayMax ).div( rayPad ).saturate().oneMinus() )
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
    const uniformThreshold = uniform( VOLUME_THRESHOLD ); 
    const uniformOpacity = uniform( VOLUME_OPACITY );
    const uniformRange = uniform( VOLUME_RANGE );
    const uniformSteps = uniform( VOLUME_STEPS );
    const uniformAlphaCutoff = uniform( VOLUME_ALPHA_CUTOFF );
    const uniformTextureScale = uniform( VOLUME_TEXTURE_SCALE );
    const uniformStart = uniform( VOLUME_START );
    const uniformStop = uniform( VOLUME_STOP );
    const uniformPadding = uniform( VOLUME_PADDING );
    const uniformTexture3D = texture3D( this.storageTexture, null, 0 );

    // p = world position
    this.fogNode = Fn(([ p ]) => {
      // ray direction
      const rayDirection = p.sub( this._cameraPosition ).toVar();

      // fog gradient 0->1
      const fogGradient = length( rayDirection ).smoothstep(FOG_START, FOG_STOP).toVar();

      // fog surface noise pattern
      const fogDistanceFactor = fogGradient.mul(FOG_DISTANCE_MULTIPLIER).max(FOG_HEIGHT).toVar();
      const fogNoiseA = triNoise3D( p.mul( .005 ), 0.2, time );
      const fogNoiseB = triNoise3D( p.mul( .01 ), 0.2, time.mul( 1.2 ) );
      const fogSurfaceNoise = fogNoiseA.add( fogNoiseB );

      // fog height fade factor
      const fogHeightFadeFactor = fogDistanceFactor.sub( p.y ).abs().div(fogDistanceFactor).pow(3).saturate().mul(FOG_ALPHA);

      // fog volumetric node
      const fogVolumetric =  VolumetricFog( {
        worldPosition: p,
        rayOrigin: this._cameraPosition,
        rayDirection,
        texture: uniformTexture3D,
        range: uniformRange,
        threshold: uniformThreshold,
        opacity: uniformOpacity,
        steps: uniformSteps,
        alphaCutoff: uniformAlphaCutoff,
        textureScale: uniformTextureScale,
        fadeStart: uniformStart,
        fadeStop: uniformStop,
        fadePadding: uniformPadding,
      } );

      return fogGradient.oneMinus()
        .mix( color( 0x0 ), fogSurfaceNoise.mul( INFLUENCE_FOG_NOISE ) )
        .add( fogVolumetric.mul( INFLUENCE_VOLUMETRIC ) )
        .mul( fogHeightFadeFactor );
    });
  }

  /** setup */
  setup( builder ) {
    const uvNode = uv();
    
    // setup 3d texture
    this.setupComputeTexture({ size: 40, timeScale: 0.1, positionScale: 0.12 });
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
      const depth = sampleDepth( uvNode ).clamp(0, 0.999).toVar();


      const viewPosition = getViewPosition( uvNode, depth, this._cameraProjectionMatrixInverse ).toVar();
      const worldPosition = this._cameraWorldMatrix.mul(viewPosition).toVar();
      output.addAssign( this.fogNode( worldPosition ) );

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