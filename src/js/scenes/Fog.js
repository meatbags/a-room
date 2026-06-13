/** Fog */

import { SceneNode } from 'engine';
import * as THREE from 'three/webgpu';
import * as tsl from 'three/tsl';
import { RaymarchingBox } from 'three/addons/tsl/utils/Raymarching.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { depth } from 'three/src/nodes/display/ViewportDepthNode.js';

// import { RaySphereIntersectDistance, RaymarchingSphere, Raymarch } from '../shader/references/RaymarchingSphere';

import { ComputeFogTexture } from '../shader/nodes/ComputeFogTexture';
import { VolumetricFog } from '../shader/nodes/VolumetricFog';
import { FogPoints } from '../shader/nodes/FogPoints';

class Fog extends SceneNode {
  constructor() {
    super({ name: 'Fog' });

    this._fogLights = [];
  }

  _init() {
    // volume compute node
    const { computeNode, storageTexture } = ComputeFogTexture();
    this.computeNode = computeNode;
    this.storageTexture = storageTexture;
    SceneNode.getSceneNode('Renderer').getRenderer().compute( this.computeNode );

    // fog range
    const FOG_START = 10;
    const FOG_STOP = 100;
    const fogRange = tsl.positionView.z.negate().smoothstep( FOG_START, FOG_STOP ).toVar();

    // height factor
    const FOG_DISTANCE_MULTIPLIER = 20;
    const FOG_HEIGHT = 50;
    const FOG_ALPHA = 0.25;
    const distance = fogRange.mul( FOG_DISTANCE_MULTIPLIER ).max( FOG_HEIGHT ).toVar();
		const fogHeightFactor = tsl.float(distance).sub(tsl.positionWorld.y).div(distance).pow(3).saturate().mul(FOG_ALPHA);

    // fog surface noise
    const fogDiffuse = tsl.color( 0xFF0000 ).toVar();
    const fogNoiseA = tsl.triNoise3D( tsl.positionWorld.mul( .005 ), 0.2, tsl.time );
    const fogNoiseB = tsl.triNoise3D( tsl.positionWorld.mul( .01 ), 0.2, tsl.time.mul( 1.2 ) );
    const fogSurfaceNoise = fogNoiseA.add( fogNoiseB );

    // fog volumetric
    const uniformThreshold = tsl.uniform( 0.1 ); 
    const uniformOpacity = tsl.uniform( 0.8 );
    const uniformRange = tsl.uniform( 0.1 );
    const uniformSteps = tsl.uniform( 50 );
    const uniformAlphaCutoff = tsl.uniform( 0.95 );
    const fogVolumetric = VolumetricFog( {
      texture: tsl.texture3D( this.storageTexture, null, 0 ),
      range: uniformRange,
      threshold: uniformThreshold,
      opacity: uniformOpacity,
      steps: uniformSteps,
      alphaCutoff: uniformAlphaCutoff,
      textureScale: tsl.uniform( 6.0 ),
    } ).toVar();

    const scene = SceneNode.getSceneNode('Scene').getScene();
    scene.fogNode = tsl.fog(
      fogRange.oneMinus()
        .mix( tsl.color( 0x0000FF ), fogSurfaceNoise )
        .add( fogVolumetric )
      , fogHeightFactor
    );
    // scene.backgroundNode = cloud3d;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshPhysicalMaterial());
    mesh.position.set(-30, 5, -25);
    scene.add(mesh);

    const mesh2 = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshPhysicalMaterial({ side: THREE.BackSide }));
    mesh2.position.set(0, 0, 0);
    scene.add(mesh2);

    // testing
    //this._addFogLight(new THREE.Vector3(-10, 3, -25), 6);
    //this._addFogLight(new THREE.Vector3(-18, 3, -30), 6);

    /*
    SceneNode.getSceneNode('Camera').addEventListener('move', p => {
      if (!this._fogLights.length) return;
      let nearest = null;
      let d = -1;
      this._fogLights.forEach(light => {
        const dist = light.position.distanceToSquared(p) / light.radiusSqr;
        if (!nearest || dist < d) {
          nearest = light;
          d = dist;
        }
      });

      // inv clamped distance factor
      const ds = 1 - (1 / Math.max(d, 1));
      uniformFogAlpha.value = 0.3 + 0.45 * ds;
      uniformThreshold.value = 0.3 - 0.3 * ds;
      uniformOpacity.value = 0.5 + 0.5 * ds;
      // uniformAlphaCutoff.value = 0.2 + 0.75 * ds;
    });
    */
  }

  _addFogLight(position, radius) {
    const scene = SceneNode.getSceneNode('Scene').getScene();
    const light = new THREE.PointLight(0xFFFFFF, 20, radius);
    light.position.copy(position);
    scene.add(light);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.125, 32, 32), new THREE.MeshBasicMaterial({color:0xFFFFFF}));
    const mesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32), 
      new THREE.MeshPhysicalNodeMaterial({
        color:0x0000FF,
        side:THREE.BackSide,
        opacity: 0.5,
        transparent: true,
        depthWrite: false,
      })
    );
    mesh.position.copy(position);
    mesh2.position.copy(position);
    // mesh2.material.backdropNode = tsl.viewportSharedTexture().rgb.mul(tsl.vec3(0, 0, 1));
    scene.add(mesh);
    this._fogLights.push({ position, radius, radiusSqr: radius*radius });
  }

  _init_BAK() {
    const fogLightWorldPosition = tsl.vec3(-25, 1.25, -25);
    const density = 0.25;
    const intensity = 1;
    const alphaStart = tsl.float(0.25).toConst();
    const alphaStop = tsl.float(0.5).toConst();
    const alphaRange = alphaStop.sub(alphaStart).toConst(); 

    // get fog alpha based on fog lights
    // input (vec4)
    const fogFunc = tsl.Fn(([ input ]) => {
      const a = tsl.cameraPosition;
      const b = tsl.positionWorld;
      const totalLight = tsl.vec3().toVar();
      const alpha = tsl.float(1);
      const f = fogLightWorldPosition;

      // segment -> light nearest p
      const af = f.sub(a).toVar();
      const ab = b.sub(a).toVar();
      const t = tsl.clamp((tsl.dot(ab, af).div(tsl.max(tsl.dot(ab, ab), 0.0001))), 0, 1);
      const nearest = a.add(ab.mul(t));

      // distance
      const fD = tsl.max(tsl.length(f.sub(nearest)), 0.0001);
      const fA = tsl.length(nearest.sub(a)).mul(-1);
      const fB = tsl.length(nearest.sub(b));

      // scale density
      fD.mulAssign( tsl.float(1).div(density) );

      /*
      totalLight.add( diffuse.rgb.mul(intensity).mul(
        tsl.atan(fB.div(fD)).div(fD)
          .sub( tsl.atan(fA.div(fD)).div(fD) )
      ) );
      */

      /*
      tsl.If( fD.lessThan(alphaStart), () => {
        alpha.assign( 
          tsl.atan(fB.div(fD)).div(fD).sub( tsl.atan(fA.div(fD)).div(fD) )
        );
      }).Else(() => {
        tsl.If( fD.lessThan(alphaStop), () => {
          alpha.assign( tsl.float(alphaStop).sub(fD).div(alphaRange).oneMinus() );
        }).Else(() => {
          alpha.assign(1);
        });
      });
      */
      alpha.assign( 
        tsl.clamp(
          tsl.atan(fB.div(fD)).div(fD).sub( tsl.atan(fA.div(fD)).div(fD) ).oneMinus(), 0, 1
        )
      );

      return tsl.vec4(input.rgb, alpha.mul(input.a));
    });

    // cloud computation
    const size = 50;
    const TIME_SCALE = 0.05;
    const PI2 = Math.PI * 2;
    const NOISE_POSITION_SCALE = 0.05; // 0.035;

    const computeCloud = tsl.Fn( ( { storageTexture } ) => {
      const id = tsl.instanceIndex;
      const x = id.mod( size ).toVar();
      const y = id.div( size ).mod( size ).toVar();
      const z = id.div( size * size ).toVar();
      const coord3d = tsl.vec3( x, y, z ).toVar();
      const centered = coord3d.sub( size / 2 ).div( size ).toVar(); // [-0.5, 0.5]
      const d = tsl.float( 1.0 ).sub( centered.length() ).toVar();
      const yGradient = centered.y.add(0.5).toVar(); // [0, 1]
      const noiseOff = tsl.time.mul( TIME_SCALE );
      const noiseCoord = coord3d.mul( NOISE_POSITION_SCALE ).mul( yGradient.mul(2).add(1) ).add( noiseOff ).toVar();
      const noise = tsl.mx_noise_vec3( noiseCoord ).toConst( 'noise' );
      const data = noise.mul( d ).mul( d ).toConst( 'data' );
      tsl.textureStore( storageTexture, tsl.vec3( x, y, z ), tsl.vec4( tsl.vec3(data.x), 1.0 ));
      /*
      const noise = tsl.mx_noise_vec3( noiseCoord ).toConst( 'noise' );
      const blendFactor = tsl.max(0, tsl.max(centered.x, tsl.max(centered.y, centered.z)).div(0.5));
      const data = noise.mul( d ).mul( d ).toConst( 'data' );


      tsl.If( centered.x.greaterThan(0), () => {
        const data2 = noise2.mul( d ).mul( d ).toConst( 'data2' );
        //const store = tsl.vec4( tsl.mix(tsl.vec3( data.x ), tsl.vec3( data2.x ), blendFactor), 1.0 );
        //tsl.textureStore( storageTexture, tsl.vec3( x, y, z ), store );
        tsl.textureStore( storageTexture, tsl.vec3( x, y, z ), tsl.vec4( tsl.vec3(1), 0.0 ));
      }).Else(() => {
        tsl.textureStore( storageTexture, tsl.vec3( x, y, z ), tsl.vec4( tsl.vec3(data.x), 1.0 ));
      });
      */
    } );
    const storageTexture = new THREE.Storage3DTexture( size, size, size );
    storageTexture.generateMipmaps = false;
    storageTexture.name = 'cloud';
    this.computeNode = computeCloud( { storageTexture } ).compute( size * size * size ).setName( 'computeCloud' );

    SceneNode.getSceneNode('Renderer').getRenderer().compute( this.computeNode );
    
    // Shader

    const MAP_SCALE = 3;

    const transparentRaymarchingTexture = tsl.Fn( ( {
      texture,
      range = tsl.float( 0.14 ),
      threshold = tsl.float( 0.08 ),
      opacity = tsl.float( 0.18 ),
      steps = tsl.float( 100 )
    } ) => {
      const finalColor = tsl.vec4( 0 ).toVar();
      const positionOffsetBase = tsl.mx_noise_vec3( tsl.positionWorld.mul(0.35) ).toVar();
      const positionOffset = tsl.mx_noise_vec3( tsl.positionWorld.mul(50) )
        .fract().mul(0.02).toVar();
      /*
      RaymarchingSphere( steps, ( { positionRay } ) => {
        const p = positionRay.add(positionOffsetBase).add(positionOffset).div( MAP_SCALE ).mod(0.5).toVar();
        const mapValue = tsl.float( texture.sample( p.add( 0.5 ) ).r ).toVar();
        mapValue.assign( 
          tsl.smoothstep( threshold.sub( range ), threshold.add( range ), mapValue
        ).mul( opacity ) );
        const shading = texture.sample( p.add( tsl.vec3( - 0.01 ) ) ).r
          .sub( texture.sample( p.add( tsl.vec3( 0.01 ) ) ).r );
        const col = shading.mul( 4.0 ).add( p.x.add( p.y ).mul( 0.5 ) ).add( 0.3 );
        finalColor.rgb.addAssign( finalColor.a.oneMinus().mul( mapValue ).mul( col ) );
        finalColor.a.addAssign( finalColor.a.oneMinus().mul( mapValue ) );
        tsl.If( finalColor.a.greaterThanEqual( 0.95 ), () => {
          tsl.Break();
        } );
      } );
      */
      return finalColor;
    } );

    const range = tsl.uniform( 0.1 );
    const threshold = tsl.uniform( 0.09 );
    const opacity = tsl.uniform( 0.8 );
    const steps = tsl.uniform( 32 );
    const cloud3d = transparentRaymarchingTexture( {
      texture: tsl.texture3D( storageTexture, null, 0 ),
      range,
      threshold,
      opacity,
      steps
    } ).toVar();

    const material = new THREE.NodeMaterial();
    const baseColor = tsl.uniform( new THREE.Color(0x888888) );
    const finalCloud = cloud3d.setRGB( cloud3d.rgb.add( baseColor ) );
    material.side = THREE.BackSide;
		material.transparent = true;
    material.depthWrite = false;
    material.colorNode = finalCloud; // fogFunc( finalCloud );

    // material.backdropNode = tsl.viewportSharedTexture().rgb.oneMinus();
    const mesh = new THREE.Mesh( new THREE.SphereGeometry(1.5, 32, 32), material);
    const mesh2 = new THREE.Mesh( new THREE.BoxGeometry(2, 2, 2), material);
    mesh.position.set(-25, 1.5, -25);
    mesh2.position.set(-22, 1.001, -25);
    // mesh.castShadow = true;

    SceneNode.getSceneNode('Scene').getScene().add( mesh, mesh2 );
  }

  update() {
    if (this.computeNode) {
      SceneNode.getSceneNode('Renderer').getRenderer().compute( this.computeNode );
    }
  }
}

export default Fog;