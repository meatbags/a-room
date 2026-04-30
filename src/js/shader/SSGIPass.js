import {
  AddEquation,
  Color,
  CustomBlending,
  DataTexture,
  DepthTexture,
  DstAlphaFactor,
  DstColorFactor,
  FloatType,
  HalfFloatType,
  MathUtils,
  Matrix4,
  MeshDepthMaterial,
  MeshNormalMaterial,
  NearestFilter,
  NoBlending,
  RedFormat,
  DepthStencilFormat,
  UnsignedInt248Type,
  RepeatWrapping,
  RGBADepthPacking,
  ShaderMaterial,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  ZeroFactor,
  UnsignedIntType,
  UnsignedByteType
} from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { VelocityShader } from 'three/addons/shaders/VelocityShader.js';

// SSGI
import { vertex } from './ssgi_vertex.glsl.js';
import { fragment } from './ssgi_fragment.glsl.js';

class SSGIPass extends Pass {
  static OUTPUT_DEFAULT = 0x1;
  static OUTPUT_NORMAL = 0x2;
  static OUTPUT_DEPTH = 0x3;
  static OUTPUT_VELOCITY = 0x4;
  static OUTPUT_SSGI = 0x5;
  static OUTPUT_ACCUMULATION = 0x6;

  constructor(scene, camera, options={}) {
    super();

    // disable swap, enable clear
    this.needsSwap = false;
		this.clear = true;

    // props
    this.camera = camera;
    this.scene = scene;
    this._visibilityCache = [];
    this._originalClearColor = new Color();
    this._size = new Vector2();
    this.output = options.output ?? SSGIPass.OUTPUT_DEFAULT;

    // render pass target
    this.renderPassTarget = new WebGLRenderTarget(512, 512, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      type: HalfFloatType,
    });
    this.renderPassTarget.texture.name = 'diffuse';
    this.renderPassTarget.texture.type = UnsignedByteType;

    // depth pass
    this.depthMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking,
    });
    this.depthRenderTarget = new WebGLRenderTarget(512, 512, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
    });

    // normal
    this.normalRenderTarget = new WebGLRenderTarget(512, 512, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      type: HalfFloatType,
    });
    this.normalRenderTarget.texture.type = UnsignedByteType;
    this.normalMaterial = new MeshNormalMaterial();
    this.normalMaterial.blending = NoBlending;

    // velocity
    this.velocityMaterial = new ShaderMaterial(VelocityShader);
    this.velocityMaterial.uniformsNeedUpdate = true;
    this.velocityMaterial.onBeforeRender = (renderer, scene, camera, geometry, object, group) => {
      if (object.matrixWorld) {
        if (!object.userData.matrixWorldPrevious) {
          object.userData.matrixWorldPrevious = new Matrix4();
        }
        this.velocityMaterial.uniforms['modelMatrixPrev'].value.copy(
          object.userData.matrixWorldPrevious);
        object.userData.matrixWorldPrevious.copy( object.matrixWorld );
      }
    };
    this.velocityRenderTarget = new WebGLRenderTarget(512, 512, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      type: HalfFloatType,
    });
    this._previousProjectionMatrix = new Matrix4();
    this._previousViewMatrix = new Matrix4();
    this._currentProjectionMatrix = new Matrix4();
    this._currentViewMatrix = new Matrix4();

    // ssgi
    this._frame = 0;
    this._temporalRotations = [ 60, 300, 180, 240, 120, 0 ];
    this._spatialOffsets = [ 0, 0.5, 0.25, 0.75 ];
    this.ssgiRenderTarget = new WebGLRenderTarget(512, 512, { type: HalfFloatType });
    this.ssgiMaterial = new ShaderMaterial({
      name: 'SSGIShader',
      defines: {},
      uniforms: {
        'sliceCount': { value: 2 },
        'stepCount': { value: 4 },
        'aoIntensity': { value: 2 },
        'giIntensity': { value: 10 },
        'radius': { value: 12 },
        'useScreenSpaceSampling': { value: true },
        'expFactor': { value: 2 },
        'thickness': { value: 1 },
        'useLinearThickness': { value: false },
        'backfaceLighting': { value: 0.25 },
        '_resolution': { value: new Vector2(512, 512) },
        '_halfProjScale': { value: 0 },
        '_temporalOffset': { value: 0 },
        '_temporalDirection': { value: 0 },
        '_cameraProjectionMatrix': { value: camera.projectionMatrix },
        '_cameraProjectionMatrixInverse': { value: camera.projectionMatrixInverse },
        '_cameraNear': { value: camera.near },
        '_cameraFar': { value: camera.far },
        'tDiffuse': { value: null },
        'tNormal': { value: null },
        'tDepth': { value: null },
        'tVelocity': { value: null },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    this.ssgiMaterial.uniforms['tNormal'].value = this.normalRenderTarget.texture;
    this.ssgiMaterial.uniforms['tDepth'].value = this.depthRenderTarget.texture;
    this.ssgiMaterial.uniforms['tVelocity'].value = this.velocityRenderTarget.texture;

    // copy material
    this.copyMaterial = new ShaderMaterial({
			uniforms: UniformsUtils.clone(CopyShader.uniforms),
			vertexShader: CopyShader.vertexShader,
			fragmentShader: CopyShader.fragmentShader,
			transparent: true,
			depthTest: false,
			depthWrite: false,
			blendSrc: DstColorFactor,
			blendDst: ZeroFactor,
			blendEquation: AddEquation,
			blendSrcAlpha: DstAlphaFactor,
			blendDstAlpha: ZeroFactor,
			blendEquationAlpha: AddEquation
		});

    // internals
    this._fsQuad = new FullScreenQuad( null );

    console.log(this._fsQuad);
  }

  /** SSGI pass */
  render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {
    // get size
    const size = renderer.getDrawingBufferSize( this._size );
		this.setSize( size.width, size.height );

    // do render pass
    this._renderOverride(renderer, null, this.renderPassTarget, renderer.getClearColor( this._originalClearColor), renderer.getClearAlpha());

    // hide lines/points
    this._overrideVisibility();

    // render depth, normals
    this._renderOverride(renderer, this.depthMaterial, this.depthRenderTarget, 0x0, 1.0);
    this._renderOverride(renderer, this.normalMaterial, this.normalRenderTarget, 0x0, 1.0);

    // render velocity
    this.camera.updateProjectionMatrix();
    this._currentProjectionMatrix.copy(this.camera.projectionMatrix);
    this._currentViewMatrix.copy(this.camera.matrixWorldInverse);
    this.velocityMaterial.uniforms['currentProjectionViewMatrix'].value.copy(this._currentProjectionMatrix).multiply(this._currentViewMatrix);
    this.velocityMaterial.uniforms['previousProjectionViewMatrix'].value.copy(this._previousProjectionMatrix).multiply(this._previousViewMatrix);
    this._renderOverride(renderer, this.velocityMaterial, this.velocityRenderTarget, 0x0, 1.0);
    this._previousProjectionMatrix.copy(this._currentProjectionMatrix);
    this._previousViewMatrix.copy(this._currentViewMatrix);

    // restor
    this._restoreVisibility();

    // render SSGI
    this._frame ++;
    this.ssgiMaterial.uniforms['_temporalDirection'].value = this._temporalRotations[ this._frame % 6 ] / 360;
		this.ssgiMaterial.uniforms['_temporalOffset'].value = this._spatialOffsets[ this._frame % 4 ];
    this.ssgiMaterial.uniforms['tDiffuse'].value = this.renderPassTarget.texture;
    this._renderPass(renderer, this.ssgiMaterial, this.ssgiRenderTarget, 0x0, 1);

    // output
    this.copyMaterial.uniforms['tDiffuse'].value = this.ssgiRenderTarget.texture;
  	this.copyMaterial.blending = NoBlending;
		this._renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : readBuffer );
  }

  // render pass with quad
  _renderPass(renderer, passMaterial, renderTarget, clearColor, clearAlpha) {
    // save original state
		renderer.getClearColor( this._originalClearColor );
		const originalClearAlpha = renderer.getClearAlpha();
		const originalAutoClear = renderer.autoClear;

		// setup pass state
		renderer.setRenderTarget( renderTarget );
		renderer.autoClear = false;
		if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {
			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );
			renderer.clear();
		}

		this._fsQuad.material = passMaterial;
		this._fsQuad.render( renderer );

		// restore original state
		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this._originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );
  }

  /** render with override material */
  _renderOverride(renderer, overrideMaterial, renderTarget, clearColor, clearAlpha) {
    renderer.getClearColor( this._originalClearColor );
		const originalClearAlpha = renderer.getClearAlpha();
		const originalAutoClear = renderer.autoClear;

		renderer.setRenderTarget( renderTarget );
		renderer.autoClear = false;
		clearColor = (overrideMaterial ? overrideMaterial.clearColor : undefined) || clearColor;
		clearAlpha = (overrideMaterial ? overrideMaterial.clearAlpha : undefined) || clearAlpha;

		if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {
			renderer.setClearColor( clearColor );
			renderer.setClearAlpha( clearAlpha || 0.0 );
			renderer.clear();
		}

		this.scene.overrideMaterial = overrideMaterial;
		renderer.render( this.scene, this.camera );
		this.scene.overrideMaterial = null;

		// restore original state
		renderer.autoClear = originalAutoClear;
		renderer.setClearColor( this._originalClearColor );
		renderer.setClearAlpha( originalClearAlpha );
  }

  /** Set size */
  setSize( width, height ) {
    this.renderPassTarget.setSize(width, height);
    this.depthRenderTarget.setSize(width, height);
    this.normalRenderTarget.setSize(width, height);
    this.velocityRenderTarget.setSize(width, height);
    this.ssgiRenderTarget.setSize(width, height);
    this.ssgiMaterial.uniforms['_resolution'].value.set(width, height);
    this.ssgiMaterial.uniforms['_halfProjScale'].value = height / 
      (Math.tan( this.camera.fov * MathUtils.DEG2RAD * 0.5 ) * 2) * 0.5;
  }

  /** set visibility */
  _overrideVisibility() {
    const scene = this.scene;
		const cache = this._visibilityCache;
		scene.traverse( function ( object ) {
			if ( ( object.isPoints || object.isLine || object.isLine2 ) && object.visible ) {
				object.visible = false;
				cache.push( object );
			}
		} );
  }

  /** restore visibility */
  _restoreVisibility() {
    const cache = this._visibilityCache;
		for ( let i = 0; i < cache.length; i ++ ) {
			cache[ i ].visible = true;
		}
		cache.length = 0;
  }

  /** free resources */
  dispose() {
    // dispose render targets
    this.renderPassTarget.dispose();
    this.depthRenderTarget.dispose();
    this.normalRenderTarget.dispose();
    this.ssgiRenderTarget.dispose();
    this.velocityRenderTarget.dispose();

    // dispose materials
    this.depthMaterial.dispose();
    this.normalMaterial.dispose();
    this.ssgiMaterial.dispose();
    this.velocityMaterial.dispose();

    // dispose full screen quad
    this._fsQuad.dispose();
  }
}

export { SSGIPass };
