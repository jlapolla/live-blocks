'use strict';

describe('getUndefined function', function () {

  var LiveBlocks = window.LiveBlocks;

  it('returns the primitive value "undefined"', function () {

    // Call getUndefined()
    expect(LiveBlocks.getUndefined()).toBeUndefined();
  });
});

