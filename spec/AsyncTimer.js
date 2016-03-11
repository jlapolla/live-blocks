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
    spyOn(timer, '_tickTock').and.callThrough();

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

        expect(log.length).toBe(0);

        // Schedule one block
        block[0].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block[0]);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block[0]);
        log.length = 0;

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(0);

        // Schedule both blocks
        block[0].schedule();
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

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

        // Check tick count
        expect(timer._tickTock.calls.count()).toBe(2);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('ignores blocks scheduled while ticking', function(done) {

    // Make a timer
    var timer = new LiveBlocks.AsyncTimer();
    spyOn(timer, '_tickTock').and.callThrough();

    // Make a log
    var log = [];

    // Make rescheduling functions
    var noop = function() {};

    var newSchedule = noop;

    // Make fake block functions
    var schedule = function() {

      timer.schedule(this);
    };

    var tick = function() {

      log.push({event: 'tick', object: this});
      newSchedule.call(this);
    };

    var tock = function() {

      log.push({event: 'tock', object: this});
    };

    // Make a fake block
    var block = {
      schedule: schedule,
      tick: tick,
      tock: tock,
    };

    var expectationCount = 0;
    var expectations = [
      function() {

        expect(log.length).toBe(0);

        // Schedule block
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(0);

        // Set up newSchedule to reschedule the block
        newSchedule = schedule;

        // Schedule block
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        // Block should be scheduled for another tick
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Set newSchedule to noop so we stop scheduling the block
        newSchedule = noop;

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        // Timer tick (block is still scheduled at this point)
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        // Timer tick (block did not reschedule this time)
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tickTock.calls.count()).toBe(4);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('does not schedule duplicate blocks', function(done) {

    // Make a timer
    var timer = new LiveBlocks.AsyncTimer();
    spyOn(timer, '_tickTock').and.callThrough();

    // Make a log
    var log = [];

    // Make fake block functions
    var schedule = function() {

      timer.schedule(this);
    };

    var tick = function() {

      log.push({event: 'tick', object: this});
    };

    var tock = function() {

      log.push({event: 'tock', object: this});
    };

    // Make a fake block
    var block = {
      schedule: schedule,
      tick: tick,
      tock: tock,
    };

    var expectationCount = 0;
    var expectations = [
      function() {

        expect(log.length).toBe(0);

        // Schedule the same block multiple times
        block.schedule();
        block.schedule();
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        // Timer ticks and block is called only once
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tickTock.calls.count()).toBe(1);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('cancel() cancels a single block, or all blocks', function(done) {

    // Make a timer
    var timer = new LiveBlocks.AsyncTimer();
    spyOn(timer, '_tickTock').and.callThrough();

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

        expect(log.length).toBe(0);

        // Cancel all blocks
        setTimeout(function() {

          timer.cancel();
          timer.cancel(); // Call twice for robustness
        });

        // Schedule both blocks
        block[0].schedule();
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(0);

        // Cancel block 0
        setTimeout(function() {

          timer.cancel(block[0]);

          // Try to cancel an unscheduled block, for robustness testing
          timer.cancel({});
        });

        // Schedule both blocks
        block[0].schedule();
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block[1]);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block[1]);
        log.length = 0;

        // Check tick count
        expect(timer._tickTock.calls.count()).toBe(1);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('enabled() enables and disables the timer', function(done) {

    // Make a timer
    var timer = new LiveBlocks.AsyncTimer();
    spyOn(timer, '_tickTock').and.callThrough();

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

        expect(log.length).toBe(0);

        // Schedule block 0
        block[0].schedule();

        // Disable the timer AFTER we schedule block 0
        timer.enabled(false);
        timer.enabled(false); // Call twice for robustness

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(timer.enabled()).toBe(false);
        expect(log.length).toBe(0);

        // Schedule block 1 while timer is disabled
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(timer.enabled()).toBe(false);
        expect(log.length).toBe(0);

        // Enable the timer
        timer.enabled(true);
        timer.enabled(true); // Call twice for robustness

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(timer.enabled()).toBe(true);
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

        // Disable the timer (nothing is scheduled)
        timer.enabled(false);
        timer.enabled(false); // Call twice for robustness

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(timer.enabled()).toBe(false);
        expect(log.length).toBe(0);

        // Enable the timer
        timer.enabled(true);
        timer.enabled(true); // Call twice for robustness

        // Next expectation
        setTimeout(expectations[expectationCount++]);
      },

      function() {

        expect(timer.enabled()).toBe(true);
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tickTock.calls.count()).toBe(1);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);
});

