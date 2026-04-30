import { perlin_noise } from './perlin_noise.glsl.js';

export const vertex = /* glsl */`
uniform float size;
uniform float scale;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif

uniform float uTime;
uniform float uSpeed;
uniform vec3 uSize;
uniform vec3 uPosition;
varying float vNoise;
const float NOISE_POSITION_SCALE = 0.5;

${ perlin_noise }

void main() {
	#ifdef USE_POINTS_UV
		vUv = (uvTransform * vec3(uv, 1)).xy;
	#endif

	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>

	// #include <begin_vertex>
	vec3 transformed = vec3( position );
	#ifdef USE_ALPHAHASH
		vPosition = vec3( position );
	#endif

	// move particle
	// transformed.x += -uTime * uSpeed;
	transformed.y += -uTime * uSpeed;
	// transformed.z += -uTime * uSpeed;

  // adjust to camera position/origin offset
	transformed.x += -uPosition.x;
	transformed.y += -uPosition.y;
	transformed.z += -uPosition.z;

	// wrap particle
	float min_x = -uSize.x / 2.0;
	float min_y = -uSize.y / 2.0;
	float min_z = -uSize.z / 2.0;
	transformed.x = mod(transformed.x - min_x, uSize.x) + min_x;
	transformed.y = mod(transformed.y - min_y, uSize.y) + min_y;
	transformed.z = mod(transformed.z - min_z, uSize.z) + min_z;

	vNoise = perlin_noise( transformed * NOISE_POSITION_SCALE );

	#include <morphtarget_vertex>
	#include <project_vertex>

	gl_PointSize = size;

	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}
`;

export const fragment = /* glsl */`
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying float vNoise;

void main() {

	float opacity_scale = (vNoise + 1.0) / 2.0;
	vec4 diffuseColor = vec4( diffuse, opacity * opacity_scale );

	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}
`;
