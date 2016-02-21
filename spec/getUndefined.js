'use strict';

describe('getUndefined function', function () {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if getUndefined is not exposed
  if (!LiveBlocks.getUndefined)
    return;

  it('returns the primitive value "undefined"', function () {

    // Call getUndefined()
    expect(LiveBlocks.getUndefined()).toBeUndefined();
  });
});

