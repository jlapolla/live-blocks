'use strict';

describe('Clock class', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if Clock is not exposed
  if (!LiveBlocks.Clock) {

    return;
  }

  it('duplicates itself', function() {

    // Make a clock
    var original = new LiveBlocks.Clock();
    expect(original instanceof LiveBlocks.Clock).toBe(true);

    // Duplicate
    var duplicate = original.duplicate();
    expect(duplicate).not.toBe(original);
    expect(duplicate instanceof LiveBlocks.Clock).toBe(true);
  });

  it('tickTock() calls tick() on all bound blocks, then calls tock()',
  function() {

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Make some synchronous blocks
    var blocks = [];
    blocks[0] = new LiveBlocks.SynchronousBlock({
      do: function() {},

      pins: {
        output: true
      },
    });
    blocks[1] = blocks[0].duplicate();

    // Create logging event listeners
    var log = [];
    var listeners = {};
    (function(list) {

      // For each event name
      for (var i = 0; i < list.length; i++) {

        // For each block
        for (var j = 0; j < blocks.length; j++) {

          // Make event listener
          listeners[list[i]] = (function(eventName) {

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

          // Register event listener
          blocks[j].on(list[i], listeners[list[i]]);
        }
      }
    }(['tick', 'tock']));

    // Set clock on blocks
    for (var i = 0; i < blocks.length; i++) {

      blocks[i].clock(clock);
    }

    // Check initial conditions
    expect(log.length).toBe(0);

    // Test stimulus
    clock.tickTock();
    expect(log.length).toBe(4);
    expect(log).toEqual([
      {event: 'tick'},
      {event: 'tick'},
      {event: 'tock'},
      {event: 'tock'},
    ]);

    // Clear log
    log.length = 0;

    // Unset clock on block[1]
    blocks[1].unsetClock();

    // Test stimulus
    clock.tickTock();
    expect(log.length).toBe(2);
    expect(log).toEqual([
      {event: 'tick'},
      {event: 'tock'},
    ]);

    // Clear log
    log.length = 0;

    // Unset clock on block[0]
    blocks[0].unsetClock();

    // Test stimulus
    clock.tickTock();
    expect(log.length).toBe(0);
  });

  xit('ignores blocks bound or unbound during tickTock()', function() {});

  xit('does not bind duplicate blocks', function() {});

  xit('does nothing when non-existent block is unbound', function() {});

  xit('blocks() iteator iterates over bound blocks', function() {});
});

