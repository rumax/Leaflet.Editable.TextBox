/**
 * SVG tools
 *
 * @author rumax
 * @license MIT
 * @preserve
 */

var TextToSvg = L.Class.extend({

  options: {
    //lineFactor: 1.618,
    lineFactor: 1.2,
    padding: 2,
    fontSize: 12,
    fontFamily: '',
    fontColor: ''
  },


  initialize: function(text, options) {
    L.Util.setOptions(this, options);
    this._text = text;
    this._lines = [];
    this._container = null;
    this._lineHeight = 0;
  },


  _createContainer: function(parentNode) {
    var container = L.SVG.create('text');
    var options = this.options;

    container.setAttribute('font-family', options.fontFamily);
    container.setAttribute('font-size', options.fontSize + 'px');
    container.setAttribute('fill', options.fontColor);

    if (parentNode) {
      parentNode.appendChild(container);
    }

    return container;
  },


  render: function(parentNode) {
    this._container = this._createContainer(parentNode);

    if ('word' === this.options.breakBy) {
      this._breakByWord();
    } else {
      this._breakByLetter();
    }

    return {
      node: this._container,
      lines: this._lines,
      lineHeight: this._lineHeight
    };
  },


  _isWhitespace: function(char) {
    return '\n' === char ||' ' === char || '\t' === char;
  },


  _breakByWord: function() {
    // TODO: clean and refactoring
    var chars = this._text.split('');
    var line = '';
    var char = chars.shift();
    var maxWidth = this.options.size.x - 2 * this.options.padding;
    var tspan = this._addLine(line);
    var prevLine = '';
    var lineLength;
    var word = '';
    var lines = [''];
    var lineInd = 0;

    while (char) {
      word += char;

      if (this._isWhitespace(char)) { //can do line break
        prevLine = line;
        line += word;

        tspan.firstChild.nodeValue = line;
        lines[lineInd] = line;
        lineLength = tspan.getComputedTextLength();

        if (lineLength > maxWidth) {
          if ('' !== prevLine) { // can break line
            tspan.firstChild.nodeValue = prevLine;
            lines[lineInd] = prevLine;
            line = word;
          } else {
            line = '';
          }

          tspan = this._addLine(line);
          lines[++lineInd] = line;

          if ('\n' === char) {
            line = '';
            tspan = this._addLine('');
            lines[++lineInd] = '';
          }
        }

        word = '';
      }

      char = chars.shift();
    }

    if ('' !== word) {
      prevLine = line;
      line += word;

      tspan.firstChild.nodeValue = line;
      lines[lineInd] = line;
      lineLength = tspan.getComputedTextLength();

      if (lineLength > maxWidth) {
        if ('' !== prevLine) {
          tspan.firstChild.nodeValue = prevLine;
          line = word;
        } else {
          line = '';
        }

        tspan = this._addLine(line);
        lines[++lineInd] = '';
      }
    }

    this._lines = lines;
  },


  _breakByLetter: function() {
    // TODO: clean and refactoring
    var chars = this._text.split('');
    var line = chars.shift();
    var char = chars.shift();
    var maxWidth = this.options.size.x - 2 * this.options.padding;
    var tspan = this._addLine(line);
    var prevLine;
    var lineLength;
    var lines = [];
    var lineInd = 0;

    while (char) {
      prevLine = line;
      line += char;
      tspan.firstChild.nodeValue = line;
      lines[lineInd] = line;
      lineLength = tspan.getComputedTextLength();

      if ('\n' === char) {
        line = '';
        tspan = this._addLine(line);
        lines[++lineInd] = line;
      } else if (lineLength > maxWidth && 1 < line.length) {
        tspan.firstChild.nodeValue = prevLine;
        lines[lineInd] = prevLine;
        line = char;
        tspan = this._addLine(line);
        lines[++lineInd] = line;
      }

      char = chars.shift();
    }

    this._lines = lines;
  },


  _addLine: function(text) {
    var tspan = L.SVG.create('tspan');
    var lineHeight = this.options.fontSize;

    tspan.setAttribute('x', this.options.padding);
    tspan.setAttribute('dy', this._lineHeight);
    tspan.appendChild(document.createTextNode(text || ''));
    this._container.appendChild(tspan);

    if (0 === this._lineHeight) {
      if (!lineHeight) {
        lineHeight = tspan.getBBox().height;
      }

      this._lineHeight = this.options.lineFactor * lineHeight;
      this._fixDyAttribute();
    }

    return tspan;
  },


  _fixDyAttribute: function() {
    var nodes = this._container.childNodes;
    for (var i = nodes.length - 1; 0 <= i; --i) {
      nodes[i].setAttribute('dy', this._lineHeight);
    }
  }

});


/**
 * @param  {SVGElement} svg
 * @return {Object}
 */
L.SVG.TextToSvg = L.SVG.TextToSvg || TextToSvg;
