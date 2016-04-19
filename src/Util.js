/**
 * @param  {Element} element
 * @param  {L.Point} size
 * @return {Object} self
 */
L.DomUtil.setSize =  L.DomUtil.setSize || function(element, size) {
  element.style.width = size.x  + 'px';
  element.style.height = size.y + 'px';
  return this;
};
