/**
 * SVG tools
 *
 * @author rumax
 * @license MIT
 * @preserve
 */

var DEFAULT_SIZE = 12;


L.SVG.calcFontSize = L.SVG.calcFontSize || function(svg) {
  var size = DEFAULT_SIZE;
  var sizeMin = Number.MAX_VALUE;
  var sizeMax = Number.MIN_VALUE;
  var texts = svg.querySelectorAll('text');
  var ind;
  var textSize;
  var ret = {
    size: size,
    min: size,
    max: size
  };

  if (texts && 0 < texts.length) {
    size = 0;
    for (ind = texts.length - 1; 0 <= ind; --ind) {
      textSize = parseFloat(texts[ind].getAttribute('font-size'));
      size += textSize;
      if (sizeMin > textSize) {
        sizeMin = textSize;
      }

      if (sizeMax < textSize) {
        sizeMax = textSize;
      }
    }

    size = Math.round(size / texts.length + 0.5);
    sizeMin = Math.round(sizeMin + 0.5);
    max: Number.MIN_VALUE === sizeMax ? size : Math.round(sizeMax + 0.5)
  }

  ret = {
    size: size,
    min: Number.MAX_VALUE === sizeMin ? size : Math.round(sizeMin + 0.5),
    max: Number.MIN_VALUE === sizeMax ? size : Math.round(sizeMax + 0.5)
  };

  return ret;
};
