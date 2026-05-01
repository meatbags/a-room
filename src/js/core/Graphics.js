/** Graphics */

import * as THREE from 'three';
import * as WebGPU from 'three/webgpu';
import { GetRoot, SceneNode } from 'engine';
import { pass, mrt, output, normalView, diffuseColor, velocity, 
  add, vec3, vec4, directionToColor, colorToDirection, sample,
  blendDodge, blendOverlay, blendScreen, blendBurn, mix, acesFilmicToneMapping
} from 'three/tsl';
// import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import Config from '../config/Config';

// import * as PostProcessing from 'postprocessing';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// modify existing nodes
import { ssgi } from '../shader/SSGINode';
import { ssgiAccumulator } from '../shader/SSGIAccumulator';
import { traa } from '../shader/TRAANode.js';
import { SSGIPass } from '../shader/SSGIPass';

export default class Graphics extends SceneNode {
  constructor() {
    super({ name: 'Graphics' });

    const root = GetRoot();
    const camera = root.getSceneNode('Camera').getCamera();
    const renderer = root.getSceneNode('Renderer');
    const sceneModule = root.getSceneNode('Scene');
    const scene = sceneModule.getScene();

    // scene setup
    const skybox = Config.Graphics.skybox;
    const texture = new THREE.TextureLoader().load(skybox.src, tex => {
      for (const key in skybox.props) tex[key] = skybox.props[key];
      tex.matrixAutoUpdate = true;
    });
    scene.backgroundBlurriness =
      Config.Graphics.backgroundBlurriness || 0;
    sceneModule.setBackground(texture);
    sceneModule.setFog(new THREE.FogExp2( Config.Graphics.fog.hex, Config.Graphics.fog.density));

    // setup
    if ( Config.Renderer.useWebGPU ) {
      const postProcessing = renderer.postProcessing;

      const scenePass = pass( scene, camera );
      scenePass.setMRT(mrt({
        output: output,
        diffuseColor: diffuseColor,
        normal: directionToColor( normalView ),
        velocity: velocity
      }));
      const scenePassColor = scenePass.getTextureNode( 'output' );
      const scenePassDiffuse = scenePass.getTextureNode( 'diffuseColor' );
      const scenePassDepth = scenePass.getTextureNode( 'depth' );
      const scenePassNormal = scenePass.getTextureNode( 'normal' );
      const scenePassVelocity = scenePass.getTextureNode( 'velocity' );

      // bandwidth optimization
      const diffuseTexture = scenePass.getTexture( 'diffuseColor' );
      diffuseTexture.type = THREE.UnsignedByteType;
      const normalTexture = scenePass.getTexture( 'normal' );
      normalTexture.type = THREE.UnsignedByteType;
      const sceneNormal = sample(( uv ) => {
        return colorToDirection( scenePassNormal.sample( uv ) );
      });

      // gi
      const giPass = ssgi( scenePassColor, scenePassDepth, sceneNormal, camera );
      
      // nb: total iterations = sliceCount * stepCount * 2
      giPass.sliceCount.value = 2;
      giPass.stepCount.value = 2;
      giPass.aoIntensity.value = 1.25; // default=1, [0, 4]
      giPass.giIntensity.value = 3.5;
      giPass.radius.value = 3; // default=12, [1, 25]
      giPass.useScreenSpaceSampling.value = true;
      giPass.expFactor.value = Config.Renderer.forceWebGL ? 1 : 2;
      giPass.thickness.value = 1;
      giPass.useLinearThickness.value = false;
      giPass.backfaceLighting.value = 0.25;
      giPass.useTemporalFiltering = true;
      
      // change settings for webgl
      if (Config.Renderer.forceWebGL) {
        giPass.sliceCount.value = 4;
        giPass.stepCount.value = 1;
      }

      // composite
      const gi = giPass.rgb;
      const ao = giPass.a;
      const compositePass = vec4(
        add(scenePassColor.rgb.mul(ao), scenePassDiffuse.rgb.mul(gi)),
        scenePassColor.a
      );

      // traa
			const traaPass = traa( compositePass, scenePassDepth, scenePassVelocity, camera );

      // ssgiAccumulator
      // const ssgiAccumulatorPass = 
      //   ssgiAccumulator(compositePass, scenePassDepth, scenePassVelocity, camera);
      //   ssgiAccumulatorPass.disableJitter = Config.Renderer.forceWebGL;

      // blend, bloom, tonemapping
      const blendFactor = Config.Renderer.forceWebGL ? 0.7 : 0;
      const mixed = blendFactor > 0
        ? vec4( mix(traaPass.rgb, scenePassColor.rgb, blendFactor), scenePassColor.a )
        : vec4( traaPass.rgb, scenePassColor.a );
      const strength = 0.3;
      const radius = 0.35;
      const threshold = 0.95;
      const final = acesFilmicToneMapping(
        mixed.add(bloom(scenePassColor, strength, radius, threshold)), 1.5);
      postProcessing.outputNode = final;
    
    // fallback to WebGL
    } else {
      // const ssgiPass = new SSGIPass( scene, camera );
      const renderPass = new RenderPass(scene, camera);
      const gtaoPass = new GTAOPass(scene, camera, 512, 512, {
        radius: 0.25,
        distanceExponent: 1.,
        thickness: 1.,
        scale: 1.,
        samples: 16,
        distanceFallOff: 1.,
        screenSpaceRadius: false,
      }, {
        lumaPhi: 10.,
        depthPhi: 2.,
        normalPhi: 3.,
        radius: 4.,
        radiusExponent: 1.,
        rings: 2.,
        samples: 16,
      });
      const outputPass = new OutputPass();
      
      // set passes
      renderer.setPasses( 
        renderPass,
        // gtaoPass,
        // ssgiPass,
        outputPass
      );
    }
  }
}