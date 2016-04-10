'use strict';

describe('maxIterations function', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if maxIterations is not exposed
  if (!LiveBlocks.maxIterations) {

    return;
  }

  // Reset maxIterations to its default value
  afterEach((function(defaultMaxIterations) {

    return function() {

      LiveBlocks.maxIterations(defaultMaxIterations);
    };
  }(LiveBlocks.maxIterations())));

  it('returns the current maxIterations setting used for'
  + ' detecting infinite loops', function() {

    expect(LiveBlocks.maxIterations()).toBe(100);
  });

  it('sets the maxIterations setting used for detecting infinite loops',
  function() {

    expect(LiveBlocks.maxIterations()).toBe(100);
  });
});

