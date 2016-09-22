const test = require('tape');
const L = require('leaflet');
require('../src/Util');

test('L.DomUtil.setSize', function (t) {
  t.plan(3);
  t.ok(L.DomUtil.setSize, 'setSize util available');

  let node = L.DomUtil.create('div');
  const size = {
    x: 10,
    y: 10
  };
  L.DomUtil.setSize(node, size);
  t.equal(node.style.width, size.x + 'px', 'width');
  t.equal(node.style.height, size.y + 'px', 'height');
});
