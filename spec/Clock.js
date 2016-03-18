'use strict';

describe('Clock class', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if Clock is not exposed
  if (!LiveBlocks.Clock) {

    return;
  }

  var dummyBlockFactory;
  beforeEach(function() {

    dummyBlockFactory = (function() {

      var doFunc = function() {};

      return function() {

        return new LiveBlocks.ClockedBlock({
          do: doFunc,
          pins: ['output'],
        });
      };
    }());
  });

  it('tick() calls tick() on all bound blocks, then calls tock()',
  function() {

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Make some synchronous blocks
    var blocks = [];
    blocks[0] = dummyBlockFactory();
    blocks[1] = dummyBlockFactory();

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
    clock.tick();
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
    clock.tick();
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
    clock.tick();
    expect(log.length).toBe(0);
  });

  it('ignores blocks bound or unbound during tick()', function() {

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Make some synchronous blocks
    var blocks = [];
    for (var i = 0; i < 3; i++) {

      blocks.push(dummyBlockFactory());
    }

    // Create logging event listeners
    var log = [];
    var listeners = {};
    (function(list) {

      // For each event name
      for (var i = 0; i < list.length; i++) {

        // For each block
        for (var j = 0; j < blocks.length; j++) {

          // Make event listener
          listeners[list[i]] = (function(eventName, blockNumber) {

            return function(arg) {

              // Create log object
              var obj = {event: eventName, block: blockNumber};
              if (typeof arg !== 'undefined') {

                obj.arg = arg;
              }

              // Add log object to log
              log.push(obj);

              // Unset clock on blocks[1]
              blocks[1].unsetClock();

              // Set clock on blocks[2]
              blocks[2].clock(clock);
            };
          }(list[i], j));

          // Register event listener
          blocks[j].on(list[i], listeners[list[i]]);
        }
      }
    }(['tick', 'tock']));

    // Set clock on blocks
    for (var i = 0; i < 2; i++) {

      blocks[i].clock(clock);
    }

    // Check initial conditions
    expect(log.length).toBe(0);
    expect(blocks[0].clock()).toBe(clock);
    expect(blocks[1].clock()).toBe(clock);
    expect(blocks[2].clock()).toBeUndefined();

    // Test stimulus
    clock.tick();
    expect(log.length).toBe(4);
    expect(log).toEqual([
      {event: 'tick', block: 0},
      {event: 'tick', block: 1},
      {event: 'tock', block: 0},
      {event: 'tock', block: 1},
    ]);
    expect(blocks[0].clock()).toBe(clock);
    expect(blocks[1].clock()).toBeUndefined();
    expect(blocks[2].clock()).toBe(clock);

    // Clear log
    log.length = 0;

    // Test stimulus
    clock.tick();
    expect(log.length).toBe(4);
    expect(log).toEqual([
      {event: 'tick', block: 0},
      {event: 'tick', block: 2},
      {event: 'tock', block: 0},
      {event: 'tock', block: 2},
    ]);
    expect(blocks[0].clock()).toBe(clock);
    expect(blocks[1].clock()).toBeUndefined();
    expect(blocks[2].clock()).toBe(clock);
  });

  it('does not bind duplicate blocks', function() {

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Make some synchronous blocks
    var block = new LiveBlocks.ClockedBlock({
      do: function() {},

      pins: {
        output: true
      },
    });

    // Create logging event listeners
    var log = [];
    var listeners = {};
    (function(list) {

      // For each event name
      for (var i = 0; i < list.length; i++) {

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
        block.on(list[i], listeners[list[i]]);
      }
    }(['tick', 'tock']));

    // Bind block to clocks, multiple times
    clock.bind(block);
    clock.bind(block);
    clock.bind(block);

    // Check initial conditions
    expect(log.length).toBe(0);

    // Test stimulus
    clock.tick();
    expect(log.length).toBe(2);
  });

  it('does nothing when non-existent block is unbound', function() {

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Make some synchronous blocks
    var blocks = [];
    for (var i = 0; i < 2; i++) {

      blocks.push(dummyBlockFactory());
    }

    // Create logging event listeners
    var log = [];
    var listeners = {};
    (function(list) {

      // For each event name
      for (var i = 0; i < list.length; i++) {

        // For each block
        for (var j = 0; j < blocks.length; j++) {

          // Make event listener
          listeners[list[i]] = (function(eventName, blockNumber) {

            return function(arg) {

              // Create log object
              var obj = {event: eventName, block: blockNumber};
              if (typeof arg !== 'undefined') {

                obj.arg = arg;
              }

              // Add log object to log
              log.push(obj);
            };
          }(list[i], j));

          // Register event listener
          blocks[j].on(list[i], listeners[list[i]]);
        }
      }
    }(['tick', 'tock']));

    // Bind blocks to clock
    clock.bind(blocks[0]);
    clock.bind(blocks[1]);

    // Unbind same clock multiple times
    clock.unbind(blocks[0]);
    clock.unbind(blocks[0]);
    clock.unbind(blocks[0]);

    // Check initial conditions
    expect(log.length).toBe(0);

    // Test stimulus
    clock.tick();
    expect(log.length).toBe(2);
    expect(log).toEqual([
      {event: 'tick', block: 1},
      {event: 'tock', block: 1},
    ]);
  });

  it('blocks() iteator iterates over bound blocks', function() {

    // Make some fake blocks
    var blocks = [];
    for (var i = 0; i < 3; i++) {

      blocks.push({});
    }

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Bind blocks to clock
    clock.bind(blocks[0]);
    clock.bind(blocks[1]);

    // Get block iterator
    var it = clock.blocks();
    expect(it.peek().value).toBe(blocks[0]);
    expect(it.next().value).toBe(blocks[0]);
    expect(it.peek().value).toBe(blocks[1]);
    expect(it.next().value).toBe(blocks[1]);
    expect(it.peek().value).toBeUndefined();
    expect(it.next().value).toBeUndefined();

    // Reset block iterator
    it.reset();

    // Change clock bindings (should not be reflected until we get a new iterator)
    clock.unbind(blocks[1]);
    clock.bind(blocks[2]);

    // Iterate over blocks
    expect(it.peek().value).toBe(blocks[0]);
    expect(it.next().value).toBe(blocks[0]);
    expect(it.peek().value).toBe(blocks[1]);
    expect(it.next().value).toBe(blocks[1]);
    expect(it.peek().value).toBeUndefined();
    expect(it.next().value).toBeUndefined();

    // Get new block iterator (now changes can be seen)
    it = clock.blocks();
    expect(it.peek().value).toBe(blocks[0]);
    expect(it.next().value).toBe(blocks[0]);
    expect(it.peek().value).toBe(blocks[2]);
    expect(it.next().value).toBe(blocks[2]);
    expect(it.peek().value).toBeUndefined();
    expect(it.next().value).toBeUndefined();
  });

  it('fires tick events', function() {

    // Make a clock
    var clock = new LiveBlocks.Clock();

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

        clock.on(list[i], listener);
      }
    }(['tick']));

    // Log should be empty initially
    expect(log.length).toBe(0);

    // Add a tick to the log
    clock.tick();
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('tick');
    log.length = 0;

    // Add a tick to the log
    clock.tick();
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('tick');
    log.length = 0;
  });
});

