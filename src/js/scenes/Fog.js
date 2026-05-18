/** Fog */

import { SceneNode } from 'engine';
import * as THREE from 'three/webgpu';

/*
import { 
  If, Fn,
  vec3, vec4, uniform, float, color,
  dot, max, atan, clamp, length,
  positionWorld, cameraPosition
} from 'three/tsl';
*/
import * as tsl from 'three/tsl';
import { RaymarchingBox } from 'three/addons/tsl/utils/Raymarching.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { depth } from 'three/src/nodes/display/ViewportDepthNode.js';

class Fog extends SceneNode {
  constructor() {
    super({ name: 'Fog' });
  }

  _init() {
    const fogLightWorldPosition = tsl.vec3(-25, 1.5, -25);
    const density = 0.25;
    const intensity = 1;
    const alphaStart = tsl.float(0.75).toConst();
    const alphaStop = tsl.float(1.25).toConst();
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
      // fD.mulAssign( float(1).div(density) );

      /*
      totalLight.add( diffuse.rgb.mul(intensity).mul(
        tsl.atan(fB.div(fD)).div(fD)
          .sub( tsl.atan(fA.div(fD)).div(fD) )
      ) );
      */

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

      return tsl.vec4(input.rgb, alpha.mul(input.a));
    });

    // cloud computation
    const size = 128;
    const TIME_SCALE = 0.25;
    const computeCloud = tsl.Fn( ( { storageTexture } ) => {
      const scale = tsl.float( 0.05 );
      const id = tsl.instanceIndex;
      const x = id.mod( size );
      const y = id.div( size ).mod( size );
      const z = id.div( size * size );
      const coord3d = tsl.vec3( x, y, z );
      const centered = coord3d.sub( size / 2 ).div( size );
      const d = tsl.float( 1.0 ).sub( centered.length() );
      const noiseCoord = coord3d.mul( scale.div( 1.5 ) ).add( tsl.time.mul(TIME_SCALE) );
      const noise = tsl.mx_noise_vec3( noiseCoord ).toConst( 'noise' );
      const data = noise.mul( d ).mul( d ).toConst( 'data' );
      tsl.textureStore( storageTexture, tsl.vec3( x, y, z ), tsl.vec4( tsl.vec3( data.x ), 1.0 ) );
    } );
    const storageTexture = new THREE.Storage3DTexture( size, size, size );
    storageTexture.generateMipmaps = false;
    storageTexture.name = 'cloud';
    this.computeNode = computeCloud( { storageTexture } ).compute( size * size * size ).setName( 'computeCloud' );

    SceneNode.getSceneNode('Renderer').getRenderer().compute( this.computeNode );
    
    // Shader
    const transparentRaymarchingTexture = tsl.Fn( ( {
      texture,
      range = tsl.float( 0.14 ),
      threshold = tsl.float( 0.08 ),
      opacity = tsl.float( 0.18 ),
      steps = tsl.float( 64 )
    } ) => {
      const finalColor = tsl.vec4( 0 ).toVar();
      RaymarchingBox( steps, ( { positionRay } ) => {
        const mapValue = tsl.float( texture.sample( positionRay.add( 0.5 ) ).r ).toVar();
        mapValue.assign( tsl.smoothstep( threshold.sub( range ), threshold.add( range ), mapValue ).mul( opacity ) );
        const shading = texture.sample( positionRay.add( tsl.vec3( - 0.01 ) ) ).r
          .sub( texture.sample( positionRay.add( tsl.vec3( 0.01 ) ) ).r );
        const col = shading.mul( 4.0 ).add( positionRay.x.add( positionRay.y ).mul( 0.5 ) ).add( 0.3 );
        finalColor.rgb.addAssign( finalColor.a.oneMinus().mul( mapValue ).mul( col ) );
        finalColor.a.addAssign( finalColor.a.oneMinus().mul( mapValue ) );
        tsl.If( finalColor.a.greaterThanEqual( 0.95 ), () => {
          tsl.Break();
        } );
      } );
      return finalColor;
    } );

    const rayMarchLogarithmic = tsl.Fn( ([]) => {
      
    });

    const range = tsl.uniform( 0.1 );
    const threshold = tsl.uniform( 0.08 );
    const opacity = tsl.uniform( 0.8 );
    const steps = tsl.uniform( 100 );
    const cloud3d = transparentRaymarchingTexture( {
      texture: tsl.texture3D( storageTexture, null, 0 ),
      range,
      threshold,
      opacity,
      steps
    } );

    const material = new THREE.NodeMaterial();

    const baseColor = tsl.uniform( new THREE.Color(0x888888) );
    const finalCloud = cloud3d.setRGB( cloud3d.rgb.add( baseColor ) );
    material.side = THREE.BackSide;
		material.transparent = true;
    material.colorNode = fogFunc( finalCloud );

    // material.backdropNode = tsl.viewportSharedTexture().rgb.oneMinus();

    const mesh = new THREE.Mesh( new THREE.SphereGeometry(1, 32, 32), material );
    mesh.position.set(-25, 1.5, -25);
    mesh.scale.setScalar(1.5);

    SceneNode.getSceneNode('Scene').getScene().add( mesh );
  }

  update() {
    SceneNode.getSceneNode('Renderer').getRenderer().compute( this.computeNode );
  }
}

export default Fog;