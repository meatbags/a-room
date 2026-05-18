/** Fog */

import { SceneNode } from 'engine';
import * as THREE from 'three/webgpu';
import { 
  If, Fn,
  vec3, vec4, uniform, float,
  dot, max, atan, clamp, length,
  positionWorld, cameraPosition
} from 'three/tsl';
import { RaymarchingBox } from 'three/addons/tsl/utils/Raymarching.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

class Fog extends SceneNode {
  constructor() {
    super({ name: 'Fog' });
  }

  _init() {
    /*
    const size = 128;
    const data = new Uint8Array( size * size * size );

    let i = 0;
    const perlin = new ImprovedNoise();
    const vector = new THREE.Vector3();

    for ( let z = 0; z < size; z ++ ) {
      for ( let y = 0; y < size; y ++ ) {
        for ( let x = 0; x < size; x ++ ) {
          vector.set( x, y, z ).divideScalar( size );
          const d = perlin.noise( vector.x * 6.5, vector.y * 6.5, vector.z * 6.5 );
          data[ i ++ ] = d * 128 + 128;
        }
      }
    }

    const texture = new THREE.Data3DTexture( data, size, size, size );
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    const opaqueRaymarchingTexture = Fn( ( { texture, steps, threshold } ) => {
      const finalColor = vec4( 0 ).toVar();
      RaymarchingBox( steps, ( { positionRay } ) => {
        const mapValue = texture.sample( positionRay.add( 0.5 ) ).r.toVar();
        If( mapValue.greaterThan( threshold ), () => {
          const p = vec3( positionRay ).add( 0.5 );
          finalColor.rgb.assign( texture.normal( p ).mul( 0.5 ).add( positionRay.mul( 1.5 ).add( 0.25 ) ) );
          finalColor.a.assign( 1 );
          Break();
        } );
      } );
      return finalColor;
    } );

    const threshold = uniform( 0.6 );
    const steps = uniform( 200 );
    */

    const fogLightWorldPosition = vec3(-25, 0, -25);
    const fogColor = vec3(0, 1, 0);
    const density = 0.25;
    const intensity = 1;
    const alphaStart = float(1.25).toConst();
    const alphaStop = float(2.75).toConst();
    const alphaRange = alphaStop.sub(alphaStart).toConst();

    const fogFunc = Fn(() => {
      const a = cameraPosition;
      const b = positionWorld;
      const totalLight = vec3().toVar();
      const alpha = float(1);
      const f = fogLightWorldPosition;

      // segment -> light nearest p
      const af = f.sub(a).toVar();
      const ab = b.sub(a).toVar();
      const t = clamp((dot(ab, af).div(max(dot(ab, ab), 0.0001))), 0, 1);
      const nearest = a.add(ab.mul(t));

      // distance
      const fD = max(length(f.sub(nearest)), 0.0001);
      const fA = length(nearest.sub(a)).mul(-1);
      const fB = length(nearest.sub(b));

      // scale density
      // fD.mulAssign( float(1).div(density) );

      totalLight.add( fogColor.mul(intensity).mul(
        atan(fB.div(fD)).div(fD).sub( atan(fA.div(fD)).div(fD) )
      ) );

      If( fD.lessThan(alphaStart), () => {
        alpha.assign(0);
      }).Else(() => {
        If ( fD.lessThan(alphaStop), () => {
          alpha.assign( float(alphaStop).sub(fD).div(alphaRange).oneMinus() );
        }).Else(() => {
          alpha.assign(1);
        });
      });

      return vec4(totalLight, alpha);
    });

    const material = new THREE.NodeMaterial();
    material.colorNode = fogFunc();
    material.side = THREE.BackSide;
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = 0;

    const mesh = new THREE.Mesh( new THREE.SphereGeometry(3, 32, 32), material );
    const mesh2 = new THREE.Mesh( new THREE.SphereGeometry(3, 32, 32), material );
    mesh.position.set(-25, 3.125, -25);
    mesh2.position.set(-23, 3.125, -25);

    SceneNode.getSceneNode('Scene').getScene().add( mesh, mesh2 );
  }
}

export default Fog;