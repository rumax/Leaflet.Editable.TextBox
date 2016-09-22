const test = require('tape');
const mapCreator = require('./helpers/map');
//const TextBox = require('./../srs/TextBox');

test('Map', function (t) {
  let map;
  t.plan(2);
  t.ok(mapCreator, 'map available');
  map = mapCreator();
  t.ok(map, 'map created');
});
