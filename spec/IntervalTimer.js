'use strict';

describe('IntervalTimer class', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if IntervalTimer is not exposed
  if (!LiveBlocks.IntervalTimer) {

    return;
  }

  var setTimeout;
  beforeEach(function() {

    setTimeout = window.setTimeout;
  });

  it('tick() calls tick() once on each scheduled block, then calls tock()',
  function(done) {

    // Make a timer
    var timer = new LiveBlocks.IntervalTimer();
    spyOn(timer, '_tick').and.callThrough();

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
        setTimeout(expectations[expectationCount++], timer.interval() * 1 / 2);
      },

      function() {

        // Interval has not passed yet
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(0);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 3 / 4);
      },

      function() {

        // Interval has passed
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block[0]);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block[0]);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(1);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval());
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count. Note that the timer runs a final tick to check
        // that no other blocks scheduled during the interval.
        expect(timer._tick.calls.count()).toBe(2);

        // Schedule first block
        block[0].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 1 / 2);
      },

      function() {

        // Interval has not passed yet
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // Schedule second block
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 3 / 4);
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
        expect(timer._tick.calls.count()).toBe(3);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval());
      },

      function() {

        // Check tick count
        expect(timer._tick.calls.count()).toBe(4);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval());
      },

      function() {

        // Check tick count
        expect(timer._tick.calls.count()).toBe(4);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('ignores blocks scheduled while ticking', function(done) {

    // Make a timer
    var timer = new LiveBlocks.IntervalTimer();
    spyOn(timer, '_tick').and.callThrough();

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
        setTimeout(expectations[expectationCount++], timer.interval() * 9 / 4);
      },

      function() {

        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval());
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // Set up newSchedule to reschedule the block
        newSchedule = schedule;

        // Schedule block
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 5 / 4);
      },

      function() {

        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(3);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval());
      },

      function() {

        // Block should be scheduled for another tick
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(4);

        // Set newSchedule to noop so we stop scheduling the block
        newSchedule = noop;

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval());
      },

      function() {

        // Timer tick (block is still scheduled at this point)
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(5);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 2);
      },

      function() {

        // Timer tick (block did not reschedule this time)
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(6);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('does not schedule duplicate blocks', function(done) {

    // Make a timer
    var timer = new LiveBlocks.IntervalTimer();
    spyOn(timer, '_tick').and.callThrough();

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
        setTimeout(expectations[expectationCount++], timer.interval() * 1 / 2);
      },

      function() {

        expect(log.length).toBe(0);

        // Schedule the same block multiple times
        block.schedule();
        block.schedule();
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 3 / 4);
      },

      function() {

        // Timer ticks and block is called only once
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(1);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 2);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('cancel() cancels a single block, or all blocks', function(done) {

    // Make a timer
    var timer = new LiveBlocks.IntervalTimer();
    spyOn(timer, '_tick').and.callThrough();

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
        }, timer.interval() / 2);

        // Schedule both blocks
        block[0].schedule();
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 9 / 4);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(0);

        // Cancel block 0
        setTimeout(function() {

          timer.cancel(block[0]);

          // Try to cancel an unscheduled block, for robustness testing
          timer.cancel({});
        }, timer.interval() / 2);

        // Schedule both blocks
        block[0].schedule();
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 5 / 4);
      },

      function() {

        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block[1]);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block[1]);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(1);

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 2);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('enabled() enables and disables the timer', function(done) {

    // Make a timer
    var timer = new LiveBlocks.IntervalTimer();
    spyOn(timer, '_tick').and.callThrough();

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
        setTimeout(expectations[expectationCount++], timer.interval() * 5 / 4);
      },

      function() {

        expect(timer.enabled()).toBe(false);
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(0);

        // Schedule block 1 while timer is disabled
        block[1].schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 5 / 4);
      },

      function() {

        expect(timer.enabled()).toBe(false);
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(0);

        // Enable the timer
        timer.enabled(true);
        timer.enabled(true); // Call twice for robustness

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 9 / 4);
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

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // Disable the timer (nothing is scheduled)
        timer.enabled(false);
        timer.enabled(false); // Call twice for robustness

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 5 / 4);
      },

      function() {

        expect(timer.enabled()).toBe(false);
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // Enable the timer
        timer.enabled(true);
        timer.enabled(true); // Call twice for robustness

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 9 / 4);
      },

      function() {

        expect(timer.enabled()).toBe(true);
        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('interval() sets the timer interval', function(done) {

    // Make a timer
    var timer = new LiveBlocks.IntervalTimer();
    spyOn(timer, '_tick').and.callThrough();

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

    var defaultInterval = timer.interval();
    var expectationCount = 0;
    var expectations = [
      function() {

        expect(log.length).toBe(0);

        // Schedule the block
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], defaultInterval * 5 / 4);
      },

      function() {

        // Timer ticks and block is called only once
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(1);

        // Next expectation
        setTimeout(expectations[expectationCount++], defaultInterval);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // Change interval
        timer.interval(defaultInterval * 2);

        // Schedule the block
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], defaultInterval * 5 / 4);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(2);

        // Next expectation
        setTimeout(expectations[expectationCount++], defaultInterval * 5 / 4);
      },

      function() {

        // Timer ticks and block is called only once
        expect(log.length).toBe(2);
        expect(log[0].event).toBe('tick');
        expect(log[0].object).toBe(block);
        expect(log[1].event).toBe('tock');
        expect(log[1].object).toBe(block);
        log.length = 0;

        // Check tick count
        expect(timer._tick.calls.count()).toBe(3);

        // Next expectation
        setTimeout(expectations[expectationCount++], defaultInterval);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(3);

        // Next expectation
        setTimeout(expectations[expectationCount++], defaultInterval);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(4);

        // Next expectation
        setTimeout(expectations[expectationCount++],
          defaultInterval * 2 * 5 / 4);
      },

      function() {

        expect(log.length).toBe(0);

        // Check tick count
        expect(timer._tick.calls.count()).toBe(4);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);

  it('fires tick events', function(done) {

    // Make a timer
    var timer = new LiveBlocks.IntervalTimer();

    // Create logging event listeners
    var log = [];
    (function(list) {

      for (var i = 0; i < list.length; i++) {

        var listener = (function(eventName) {

          return function(arg) {

            // Create log object
            var obj = {event: eventName};
            if (typeof arg !== 'undefined') {

              obj.arg = arg;
            }

            // Add log object to log
            log.push(obj);
          };
        }(list[i]));

        timer.on(list[i], listener);
      }
    }(['tick']));

    // Make fake block functions
    var schedule = function() {

      timer.schedule(this);
    };

    var tick = function() {};

    var tock = tick;

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

        // Schedule a block
        block.schedule();

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 3 / 2);
      },

      function() {

        // Timer emits one tick event
        expect(log.length).toBe(1);
        expect(log[0].event).toBe('tick');
        log.length = 0;

        // Next expectation
        setTimeout(expectations[expectationCount++], timer.interval() * 2);
      },

      function() {

        expect(log.length).toBe(0);

        // End test
        done();
      },
    ];

    // Start tests
    setTimeout(expectations[expectationCount++]);
  }, 1000);
});

