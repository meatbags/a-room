/** Graphics */

import Config from '../config/Config';

// three
import * as THREE from 'three';
import * as WebGPU from 'three/webgpu';
import { GetRoot, SceneNode } from 'engine';
import { pass, mrt, output, normalView, diffuseColor, velocity, 
  add, vec3, vec4, directionToColor, colorToDirection, sample,
  blendDodge, blendOverlay, blendScreen, blendBurn, mix, acesFilmicToneMapping, Fn, min, max
} from 'three/tsl';

// three render pipeline nodes
// import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';

// pipeline override
import { ssgi_extended } from '../shader/SSGINodeExtended.js';

// webgl fallback passes, todo: remove?
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export default class Graphics extends SceneNode {
  constructor() {
    super({ name: 'Graphics' });

    const root = GetRoot();
    const camera = root.getSceneNode('Camera').getCamera();
    const renderer = root.getSceneNode('Renderer');
    const sceneModule = root.getSceneNode('Scene');
    const scene = sceneModule.getScene();
    const config = Config.Graphics ?? {};

    // scene setup
    if (config.skybox) {
      const texture = new THREE.TextureLoader().load(config.skybox.src, tex => {
        for (const key in config.skybox.props) {
          tex[key] = config.skybox.props[key];
        }
        tex.matrixAutoUpdate = true;
      });
      sceneModule.setBackground(texture);
    }
    scene.backgroundBlurriness = config.backgroundBlurriness ?? 0;
    if (config.fog) {
      sceneModule.setFog(new THREE.FogExp2( config.fog.hex ?? 0x0, config.fog.density ?? 0.001 ));
    }

    // render pipeline
    const renderPipeline = renderer.postProcessing;

    // scene pass
    const scenePass = pass( scene, camera );
    scenePass.setMRT(mrt({
      output: output,
      diffuseColor: diffuseColor,
      normal: directionToColor( normalView ),
      velocity: velocity,
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

    // gi pass
    // const giPass = ssgi( scenePassColor, scenePassDepth, sceneNormal, camera );
    const giPass = ssgi_extended( scenePassColor, scenePassDepth, sceneNormal, camera );
    
    giPass.rangeStart.value = 5;
    giPass.rangeStop.value = 10;
    
    giPass.sliceCount.value = 3; // NB: iter = sliceCount * stepCount * 2
    giPass.stepCount.value = 2;
    giPass.aoIntensity.value = 1.0; // default=1, [0, 4]
    giPass.giIntensity.value = 3.5;
    giPass.radius.value = 6; // default=12, [1, 25]
    giPass.useScreenSpaceSampling.value = true;
    giPass.expFactor.value = 2;
    giPass.thickness.value = 1;
    giPass.useLinearThickness.value = false;
    giPass.backfaceLighting.value = 0.3;
    giPass.useTemporalFiltering = true;
    
    // change settings for webgl
    if (Config.Renderer.forceWebGL) {
      giPass.sliceCount.value = 4;
      giPass.stepCount.value = 1;
      giPass.expFactor.value = 1;
    }

    // composite
    const gi = giPass.rgb;
    const ao = giPass.a;
    const compositePass = vec4(
      add(
        scenePassColor.rgb.mul(ao),
        scenePassDiffuse.rgb.mul(gi)
      ),
      scenePassColor.a
    );

    // traa pass
    const traaPass = traa( compositePass, scenePassDepth, scenePassVelocity, camera );

    // bloom pass
    const strength = 0.3;
    const radius = 0.35;
    const threshold = 0.95;
    const bloomPass = traaPass.add(bloom(scenePassColor, strength, radius, threshold))

    // tone mapping pass
    const toneMapping = acesFilmicToneMapping(bloomPass, 1.5);
    renderPipeline.outputNode = toneMapping;
  }
}