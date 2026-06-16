/** ExtractMeshes */

/** @return {Array} */
export default group => {
  const meshes = [];
  group.traverse(child => {
    if (child.isMesh) meshes.push(child);
  });
  return meshes;
};