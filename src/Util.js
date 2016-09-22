/**
 * @param  {Element} element
 * @param  {L.Point} size
 * @return {Object} self
 */
L.DomUtil.setSize =  L.DomUtil.setSize || function(node, size) {
  node.style.width = size.x  + 'px';
  node.style.height = size.y + 'px';
  return this;
};
