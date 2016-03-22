'use strict';

describe('isArray function', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if isArray is not exposed
  if (!LiveBlocks.isArray) {

    return;
  }

  it('returns true if an object is an array, false otherwise', function() {

    expect(LiveBlocks.isArray([])).toBe(true);
    expect(LiveBlocks.isArray({})).toBe(false);
    expect(LiveBlocks.isArray('a')).toBe(false);
    expect(LiveBlocks.isArray(3)).toBe(false);
  });
});

