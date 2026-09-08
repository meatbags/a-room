/** Material utils */

/**
 * Clone material w/ optional clone callback.
 * 
 * @param {Material|Array} material 
 * @param {function} callback 
 */
export const CloneMaterial = (material, callback=null) => {
  if (Array.isArray(material)) {
    return material.map(m => CloneMaterial(m, callback));
  } else {
    return callback ? callback(material) : material.clone();
  }
};