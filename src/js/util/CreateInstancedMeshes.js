/** util: create instanced meshes from object */

import * as THREE from 'three';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

const optimisationMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xFFFFFF, 
  metalness: 0.05, 
  roughness: 0.95,
  emissive: 0xFFFFFF,
  emissiveIntensity: 0.1,
});
const optimisationInteractiveMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xFFFFFF, 
  metalness: 0.05, 
  roughness: 0.95,
  emissive: 0x00FF00,
  emissiveIntensity: 0.25,
});
const optimisationMaterialTransparent = new THREE.MeshPhysicalMaterial({
  color: 0xFFFFFF, metalness: 0, roughness: 0, transmission: 1 });

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
      // const mesh = new THREE.InstancedMesh(child.geometry, child.material, count);
      const mesh = new THREE.InstancedMesh(
        child.geometry, 
        child.material.transparent || child.material.transmission !== 0 
          ? optimisationMaterialTransparent : optimisationMaterial,
        count
      );
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
        if (t[1].isEuler) _tmp.rotation.copy(t[1]);
        else _tmp.rotation.y = t[1];
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

export { CreateInstancedMeshes, optimisationMaterial, optimisationInteractiveMaterial };