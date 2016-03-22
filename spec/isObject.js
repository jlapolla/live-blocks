'use strict';

describe('isObject function', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if isObject is not exposed
  if (!LiveBlocks.isObject) {

    return;
  }

  it('returns true if an object is an object, false otherwise', function() {

    expect(LiveBlocks.isObject({})).toBe(true);
    expect(LiveBlocks.isObject([])).toBe(false);
    expect(LiveBlocks.isObject('a')).toBe(false);
    expect(LiveBlocks.isObject(3)).toBe(false);
    expect(LiveBlocks.isObject(function() {})).toBe(false);
  });
});

