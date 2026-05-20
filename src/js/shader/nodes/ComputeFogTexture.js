/** ComputeFogTexture */

import { Storage3DTexture, RepeatWrapping } from 'three/webgpu';
import { Fn, If, instanceIndex, float, vec3, vec4, mx_noise_vec3, time, textureStore, length } from 'three/tsl';

export const ComputeFogTexture = () => {
  const size = 50;
  const TIME_SCALE = 0.05;
  const NOISE_POSITION_SCALE = 0.05; // 0.035;

  const computeCloud = Fn( ([ storageTexture ]) => {
    const id = instanceIndex;
    const x = id.mod( size ).toVar();
    const y = id.div( size ).mod( size ).toVar();
    const z = id.div( size * size ).toVar();
    const coord3d = vec3( x, y, z ).toVar();
    const centered = coord3d.sub( size / 2 ).div( size ).toVar(); // [-0.5, 0.5]
    const d = float( 1.0 ).sub( centered.length() ).toVar();
    const yGradient = centered.y.add(0.5).toVar(); // [0, 1]
    const noiseOff = time.mul( TIME_SCALE );
    const noiseCoord = coord3d.mul( NOISE_POSITION_SCALE )
      .mul( yGradient.mul(2).add(1) ).add( noiseOff ).toVar();
    const noise = mx_noise_vec3( noiseCoord ).toConst( 'noise' );
    const data = noise.mul( d ).mul( d ).toConst( 'data' );
    textureStore( storageTexture, vec3( x, y, z ), vec4( vec3(data.x), 1.0 ));
  } );

  const storageTexture = new Storage3DTexture(size, size, size);
  //storageTexture.wrapS = RepeatWrapping;
  //storageTexture.wrapT = RepeatWrapping;
  storageTexture.generateMipmaps = false;
  const computeNode = computeCloud(storageTexture).compute(size * size * size);

  return { computeNode, storageTexture };
};