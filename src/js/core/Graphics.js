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
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';

// pipeline override
import { traa } from '../shader/TRAANode.js';

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
    const giPass = ssgi( scenePassColor, scenePassDepth, sceneNormal, camera );
    
    // nb: total iterations = sliceCount * stepCount * 2
    giPass.sliceCount.value = 3;
    giPass.stepCount.value = 2;
    giPass.aoIntensity.value = 1.0; // default=1, [0, 4]
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
    const darker = Fn((a, b) => {
      return vec4(
        min(a.rgba, b.rgba)
      );
    });
    const compositePass = darker(
      vec4(add(scenePassColor.rgb.mul(ao), scenePassDiffuse.rgb.mul(gi)), scenePassColor.a),
      scenePassColor
    );

    // traa
    const traaPass = traa( compositePass, scenePassDepth, scenePassVelocity, camera );

    // bloom pass
    const strength = 0.3;
    const radius = 0.35;
    const threshold = 0.95;
    const bloomPass = traaPass.add(bloom(scenePassColor, strength, radius, threshold))

    // blend, bloom, tonemapping
    //const blendFactor = Config.Renderer.forceWebGL ? 0.7 : 0;
    //const mixed = blendFactor > 0
    //  ? vec4( mix(traaPass.rgb, scenePassColor.rgb, blendFactor), scenePassColor.a )
    //  : vec4( traaPass.rgb, scenePassColor.a );
    
    const final = acesFilmicToneMapping(bloomPass, 1.5);
    renderPipeline.outputNode = final;
  }
}