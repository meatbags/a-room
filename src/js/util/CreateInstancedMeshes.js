/** util: create instanced meshes from object */

import * as THREE from 'three';

/** check should cast shadow */
const ShouldCastShadow = (material) => {
  if (Array.isArray(material)) {
    for (let i=0; i<material.length; i++) {
      if ( ! ShouldCastShadow(material[i]) ) {
        return false;
      }
    }
    return true;
  }
  return material.transparent == false && 
    material.transmission == 0;
};

/** create instanced meshes */
const CreateInstancedMeshes = (object, count=0, transforms=null, shadows=true) => {
  const meshes = [];

  // prevent 0 count error
  if (!count) return meshes;

  // find distinct meshes
  object.traverse(child => {
    if (child.isMesh) {
      const mesh = new THREE.InstancedMesh(child.geometry, child.material, count);
      if (shadows) {
        if (ShouldCastShadow(child.material)) {
          mesh.castShadow = true;
        }
        mesh.receiveShadow = true; 
      }
      meshes.push(mesh);
    }
  });

  // apply transforms
  if (transforms && transforms.length) {
    const _tmp = new THREE.Object3D();
    transforms.forEach((t, i) => {
      // set transform
      _tmp.position.copy(t[0]);
      if (t.length > 1) {
        _tmp.rotation.y = t[1];
      }
      _tmp.updateMatrix();
      
      // set matrix
      meshes.forEach(mesh => {
        mesh.setMatrixAt(i, _tmp.matrix);
      });
    });
  }

  return meshes;
};

export default CreateInstancedMeshes;