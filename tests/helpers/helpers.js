import Ember from 'ember';
var compile = Ember.Handlebars.compile;

function generateContent(n) {
  var content = Ember.A();
  for (var i = 0; i < n; i++) {
    content.push({name: "Item " + (i+1)});
  }
  return content;
}
function extractPositionFromTransform(string) {
  var matched, x, y, position;

  matched = string.match(/translate(?:3d)?\((-?\d+)px,\s*(-?\d+)px/);

  x = parseInt(matched[1], 10);
  y = parseInt(matched[2], 10);

  position = {
    x: x,
    y: y
  };

  return position;
}

function extractNumberFromPosition(string) {
  var number = string.replace(/px/g,'');
  return parseInt(number, 10);
}
function extractPosition(element) {
  var style, position, i;

  style = element.style;

  position = {x: 0, y:0};
  if (style.top) {
    position.x += extractNumberFromPosition(style.top);
    position.y += extractNumberFromPosition(style.left);
  }
  for (i in Array.apply(null, style)) {
    var transformProp = style[i];
    if (/transform/.test(transformProp)) {
      var transPosition = extractPositionFromTransform(style[transformProp]);
      position.x += transPosition.x;
      position.y += transPosition.y;
      break;      
    }
  }
  return position;
}

function sortElementsByPosition (elements) {
  return elements.sort(function(a, b){
    var aPosition, bPosition;

    aPosition = extractPosition(a);
    bPosition = extractPosition(b);

    if (bPosition.y === aPosition.y){
      return (aPosition.x - bPosition.x);
    } else {
      return (aPosition.y - bPosition.y);
    }
  });
}

function sortByPosition (a, b) {
  var aPosition, bPosition;

  aPosition = a;
  bPosition = b;

  if (bPosition.y === aPosition.y){
    return (aPosition.x - bPosition.x);
  } else {
    return (aPosition.y - bPosition.y);
  }
}

function itemPositions(view) {
  return Ember.A(view.$('.ember-list-item-view').toArray()).map(function(e) {
    return extractPosition(e);
  }).sort(sortByPosition);
}
function checkContent(view, assert, expectedFirstItem, expectedCount) {
  var elements = sortElementsByPosition(view.$('.ember-list-item-view'))
    .filter(function(){ return $(this).css('display') !== 'none'; });
  var content = view.get('content') || [];
  assert.ok(
    expectedFirstItem + expectedCount <= content.length,
    'No more items than are in content are rendered.');
  var buffer = view.get('buffer') | 5;
  var width = view.get('width') | 0;
  var itemWidth = view.get('itemWidth') || 1;
  var istart = Math.max(expectedFirstItem - buffer, 0);
  // TODO: padding is one extra row -- how to calculate with mixed grid
  var padding = Math.floor(width / itemWidth);
  // include buffer before
  var scount = expectedCount + Math.min(expectedFirstItem, buffer);
  // include padding (in case of non-integral scroll)
  var pcount = scount + Math.min(Math.max(content.length - istart - scount, 0), padding);
  // include buffer after
  var count = pcount + Math.min(Math.max(content.length - istart - pcount, 0), buffer);
  assert.equal(
    elements.length, count, "Rendered expected number of elements.");
  for (let i = 0; i < count; i++) {
    let elt = elements[i];
    let item = content[i + istart];
    assert.equal(
      $(elt).text().trim(), item.name, 
      'Item ' + (i + 1) + ' rendered');
  }
}

export {
  itemPositions,
  generateContent,
  sortElementsByPosition,
  extractPosition,
  checkContent,
  compile };
