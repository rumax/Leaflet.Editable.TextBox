/**
 * SVG tools
 *
 * @author rumax
 * @license MIT
 * @preserve
 */

var DEFAULT_SIZE = 12;
var LINE_FACTOR  = 1.12;


/**
 * @param  {SVGElement} svg
 * @return {Object}
 */
L.SVG.calcFontSize = L.SVG.calcFontSize || function(svg) {
  var size    = DEFAULT_SIZE;
  var sizeMin = Number.MAX_VALUE;
  var sizeMax = Number.MIN_VALUE;
  var texts   = svg.querySelectorAll('text');
  var textSize;

  if (0 < texts.length) {
    size = 0;
    for (var ind = texts.length - 1; 0 <= ind; --ind) {
      textSize = parseFloat(texts[ind].getAttribute('font-size'));
      size += textSize;
      if (sizeMin > textSize) {
        sizeMin = textSize;
      }

      if (sizeMax < textSize) {
        sizeMax = textSize;
      }
    }

    return {
      size: Math.round(size / texts.length + 0.5),
      min: Math.round(sizeMin + 0.5),
      max: Number.MIN_VALUE === sizeMax ? size : Math.round(sizeMax + 0.5)
    };
  }

  return {
    size: size,
    min: size,
    max: size
  };
};


L.SVG.include({

  renderText: function(layer) {
    var textElement = layer._textNode;
    var text  = layer._text;

    if (textElement) {
      textElement.parentNode.removeChild(textElement);
    }
    textElement = layer._textNode = L.SVG.create('text');
    layer.updateStyle();
    this._rootGroup.appendChild(textElement);

    if (text) {
      var scale = layer._getScale(this._map.getZoom());
      var pos   = layer._rings[0][1];
      var size  = layer._rings[0][3].subtract(pos).divideBy(scale);

      var chars = text.split('');
      var line = chars.shift();
      var char = chars.shift();
      var lineInd = 1;
      var maxWidth = size.x - layer.options.padding;
      var tspan = this._textMakeNextLine(textElement, line, {
        x: layer.options.padding
      });
      var lineHeight = textElement.getBBox().height;
      tspan.setAttribute('dy', lineHeight);

      while (char) {
        if (' ' === char) {
          line += char;
        } else if ('\n' === char) {
          line = '';
          tspan = this._textMakeNextLine(textElement, line, {
            x: layer.options.padding,
            dy: LINE_FACTOR * lineHeight
          });
        } else if ('\t' !== char) { //skip tabs
          var prevLine = line;
          line += char;
          tspan.firstChild.nodeValue = line;
          var lineLength = layer.options.padding +
            tspan.getComputedTextLength();

          if (lineLength > maxWidth && 1 <= line.length) {
            ++lineInd;
            tspan.firstChild.nodeValue = prevLine.replace(/\s*$/gm, '');
            prevLine = '';
            line = char;
            tspan = this._textMakeNextLine(textElement, line, {
              x: layer.options.padding,
              dy: LINE_FACTOR * lineHeight
            });
          }
        }
        char = chars.shift();
      }
    } else if (null !== textElement) {
      textElement.parentNode.removeChild(textElement);
      textElement = null;
    }

    return textElement;
  },


  _textMakeNextLine: function(container, text, attrs) {
    var tspan = L.SVG.create('tspan');
    var key;

    for (key in attrs || {}) {
      if (attrs.hasOwnProperty(key)) {
        tspan.setAttribute(key, attrs[key]);
      }
    }
    tspan.appendChild(document.createTextNode(text || ''));
    container.appendChild(tspan);

    return tspan;
  }
});
