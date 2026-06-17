/** find object by callback util */

export default (obj, cb) => {
  let found = null;
  obj.traverse(child => {
    if (!found && cb(child)) {
      found = child;
    }
  });
  return found;
};