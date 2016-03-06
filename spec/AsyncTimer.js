'use strict';

describe('AsyncTimer class', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if AsyncTimer is not exposed
  if (!LiveBlocks.AsyncTimer) {

    return;
  }

  var setTimeout;
  beforeEach(function() {

    setTimeout = window.setTimeout;
  });

  it('duplicates itself', function() {

    // Make a timer
    var original = new LiveBlocks.AsyncTimer();
    expect(original instanceof LiveBlocks.AsyncTimer).toBe(true);

    // Duplicate
    var duplicate = original.duplicate();
    expect(duplicate).not.toBe(original);
    expect(duplicate instanceof LiveBlocks.AsyncTimer).toBe(true);
  });

  it('tickTock() calls tick() once on each scheduled block, then calls tock()',
  function(done) {

    // Make a timer
    var timer = new LiveBlocks.AsyncTimer();

    // Make a log
    var log = [];

    // Make fake block functions;
    var schedule = function() {

      timer.schedule(this);
    };

    var tick = function() {

      log.push({event: 'tick', object: this});
    };

    var tock = function() {

      log.push({event: 'tock', object: this});
    };

    // Make some fake blocks
    var block = [];
    for (var i = 0; i < 2; i++) {

      block.push({
        schedule: schedule,
        tick: tick,
        tock: tock,
      });
    }

    var expectationCount = 0;
    var expectations = [
      function() {

        // Timer tick
        expect(log.length).toBe(0);

        // Schedule one block
        block[0].schedule();

        // Trigger next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        // Timer tick
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block[0]);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block[0]);
        log.length = 0;

        // Timer tick
        expect(log.length).toBe(0);

        // Schedule both blocks
        block[0].schedule();
        block[1].schedule();

        // Trigger next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        // Timer tick
        expect(log.length).toBe(4);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block[0]);
        expect(log[1].event).toBe('tick');
        expect(log[1].object).toBe(block[1]);
        expect(log[2].event).toBe('tock');
        expect(log[2].object).toBe(block[0]);
        expect(log[3].event).toBe('tock');
        expect(log[3].object).toBe(block[1]);
        log.length = 0;

        // End test
        done();
      },
    ];

    // Start tests
    expectations[expectationCount++]();
  }, 1000);
});

