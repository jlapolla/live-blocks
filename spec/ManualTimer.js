'use strict';

describe('ManualTimer class', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if ManualTimer is not exposed
  if (!LiveBlocks.ManualTimer) {

    return;
  }

  it('tickTock() calls tick() once on each scheduled block, then calls tock()',
  function() {

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

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

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(0);

    // Schedule one block
    block[0].schedule();

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].object).toBe(block[0]);
    expect(log[1].event).toBe('tock');
    expect(log[1].object).toBe(block[0]);
    log.length = 0;

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(0);

    // Schedule both blocks
    block[0].schedule();
    block[1].schedule();

    // Timer tick
    timer.tickTock();
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
  });

  it('ignores blocks scheduled during tickTock()', function() {

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Make a log
    var log = [];

    // Make fake block functions
    var noop = function() {};

    var newSchedule = noop;
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

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(0);

    // Schedule block
    block.schedule();

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].object).toBe(block);
    expect(log[1].event).toBe('tock');
    expect(log[1].object).toBe(block);
    log.length = 0;

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(0);

    // Set up newSchedule to reschedule the block
    newSchedule = schedule;

    // Schedule block
    block.schedule();

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].object).toBe(block);
    expect(log[1].event).toBe('tock');
    expect(log[1].object).toBe(block);
    log.length = 0;

    // Block should be scheduled for another tick
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].object).toBe(block);
    expect(log[1].event).toBe('tock');
    expect(log[1].object).toBe(block);
    log.length = 0;

    // Set newSchedule to noop so we stop scheduling the block
    newSchedule = noop;

    // Timer tick (block is still scheduled at this point)
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].object).toBe(block);
    expect(log[1].event).toBe('tock');
    expect(log[1].object).toBe(block);
    log.length = 0;

    // Timer tick (block did not reschedule this time)
    timer.tickTock();
    expect(log.length).toBe(0);
  });

  it('does not schedule duplicate blocks', function() {

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

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

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(0);

    // Schedule the same block multiple times
    block.schedule();
    block.schedule();
    block.schedule();

    // Timer ticks and block is called only once
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].object).toBe(block);
    expect(log[1].event).toBe('tock');
    expect(log[1].object).toBe(block);
    log.length = 0;

    // Timer tick
    timer.tickTock();
    expect(log.length).toBe(0);
  });

  it('cancel() cancels a single block, or all blocks', function() {

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

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

    // Tick timer
    timer.tickTock();
    expect(log.length).toBe(0);

    // Schedule both blocks
    block[0].schedule();
    block[1].schedule();

    // Cancel all blocks
    timer.cancel();
    timer.cancel(); // Call twice for robustness

    // Tick timer
    timer.tickTock();
    expect(log.length).toBe(0);

    // Schedule both blocks
    block[0].schedule();
    block[1].schedule();

    // Cancel block 0
    timer.cancel(block[0]);
    timer.cancel(block[0]); // Call twice for robustness

    // Try to cancel an unscheduled block, for robustness testing
    timer.cancel({});

    // Tick timer
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].object).toBe(block[1]);
    expect(log[1].event).toBe('tock');
    expect(log[1].object).toBe(block[1]);
    log.length = 0;

    // Tick timer
    timer.tickTock();
    expect(log.length).toBe(0);
  });
});

