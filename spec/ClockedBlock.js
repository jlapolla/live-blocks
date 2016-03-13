'use strict';

describe('ClockedBlock class', function() {

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  // Skip test if ClockedBlock is not exposed
  if (!LiveBlocks.ClockedBlock) {

    return;
  }

  var assertFiniteNumber;
  beforeEach(function() {

    assertFiniteNumber = (function(isFinite, Error) {

      return function(num) {

        if (!(typeof num === 'number' && isFinite(num))) {

          throw new Error(num + ' must be a number');
        }
      };
    }(host.isFinite, host.Error));
  });

  it('integration test with Clock class', function() {

    // Used to capture "this" in "do" function
    var thisArg = true;

    // Make ramp block
    var rampBlock = new LiveBlocks
    .ClockedBlock((function(assertFiniteNumber) {

      var doFunc = function(input, output) {

        assertFiniteNumber(input.output);
        output.output = input.output + 1;

        // Assign to an undefined pin, just to test robustness
        output.noexist = input.output * 2;

        // Copy out "this"
        thisArg = this;
      };

      var pins = ['output'];

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make an integrator block
    var integratorBlock = new LiveBlocks
    .ClockedBlock((function(assertFiniteNumber) {

      var doFunc = function(input, output) {

        assertFiniteNumber(input.input);
        assertFiniteNumber(input.output);

        output.output = input.input + input.output;
      };

      var pins = ['input', 'output'];

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make wires
    var wires = {
      ramp: new LiveBlocks.Wire(),
      integral: new LiveBlocks.Wire(),
    };

    // Set initial values
    wires.ramp.value(0);
    wires.integral.value(0);

    // Connect blocks to wires
    rampBlock.connect('output', wires.ramp);
    integratorBlock.connect('input', wires.ramp);
    integratorBlock.connect('output', wires.integral);

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Set clock on blocks
    rampBlock.clock(clock);
    integratorBlock.clock(clock);

    // Test stimulus
    expect(wires.ramp.value()).toBe(0);
    expect(wires.integral.value()).toBe(0);

    // Test stimulus
    clock.tickTock();
    expect(wires.ramp.value()).toBe(1);
    expect(wires.integral.value()).toBe(0);

    // Test stimulus
    clock.tickTock();
    expect(wires.ramp.value()).toBe(2);
    expect(wires.integral.value()).toBe(1);

    // Test stimulus
    clock.tickTock();
    expect(wires.ramp.value()).toBe(3);
    expect(wires.integral.value()).toBe(3);

    // Test stimulus
    clock.tickTock();
    expect(wires.ramp.value()).toBe(4);
    expect(wires.integral.value()).toBe(6);

    // Reset ramp wire manually
    wires.ramp.value(-3);

    // Test stimulus
    clock.tickTock();
    expect(wires.ramp.value()).toBe(-2);
    expect(wires.integral.value()).toBe(3);

    // Test stimulus
    clock.tickTock();
    expect(wires.ramp.value()).toBe(-1);
    expect(wires.integral.value()).toBe(1);

    // Test stimulus
    clock.tickTock();
    expect(wires.ramp.value()).toBe(0);
    expect(wires.integral.value()).toBe(0);

    // Check that "this" is undefined in "do" function
    expect(thisArg).toBeUndefined();
  });

  it('duplicates injected dependencies', function() {

    // Create do function and pins definition hash
    var doFunc = function() {};

    var pins = ['a', 'b'];

    // Create a synchronous block
    var block = new LiveBlocks.ClockedBlock({
      do: doFunc,
      pins: pins,
    });
    expect(block._pins).not.toBe(pins);
    expect(block._pins.a).toBe(block._pins);
    expect(block._pins.b).toBe(block._pins);
    expect(block._do).toBe(doFunc);

    // Duplicate synchronous block
    var duplicate = block.duplicate();
    expect(duplicate._pins).not.toBe(block._pins);
    expect(duplicate._pins.a).toBe(duplicate._pins);
    expect(duplicate._pins.b).toBe(duplicate._pins);
    expect(duplicate._do).toBe(doFunc);
  });

  it('catches exceptions in the "do" function', function() {

    // Make ramp block
    var block = new LiveBlocks.ClockedBlock((function(assertFiniteNumber) {

      var doFunc = function(input, output) {

        assertFiniteNumber(input.output);
        output.output = input.output + 1;
      };

      var pins = ['output'];

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make some wires
    var wire = new LiveBlocks.Wire();

    // Connect blocks to wires
    block.connect('output', wire);

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Set clock for blocks
    block.clock(clock);

    // Verify initial condition
    expect(wire.value()).toBeUndefined();
    expect(block.error()).toBeUndefined();

    // Test stimulus
    clock.tickTock();
    expect(wire.value()).toBeUndefined();
    expect(block.error().message).toBe('undefined must be a number');

    // Test stimulus
    wire.value(1);
    expect(block.error().message).toBe('undefined must be a number');
    clock.tickTock();
    expect(wire.value()).toBe(2);
    expect(block.error()).toBeUndefined();

    // Test stimulus
    wire.value('a');
    clock.tickTock();
    expect(wire.value()).toBe('a');
    expect(block.error().message).toBe('a must be a number');
  });

  it('throws error when connecting to a non-existent pin', function() {

    // Make a block
    var block = new LiveBlocks.ClockedBlock((function() {

      var pins = ['output'];

      return {pins: pins};
    }()));

    // Make a wire
    var wire = new LiveBlocks.Wire();

    // Connect wire to valid pin on the block
    block.connect('output', wire);

    // Connect wire to invalid pin on the block
    var err = function() {

      block.connect('noexist', wire);
    };

    expect(err).toThrowError('Pin "noexist" not found');
  });

  it('fires events on pin connect and disconnect', function() {

    // Make a block
    var block = new LiveBlocks.ClockedBlock((function() {

      var pins = ['a', 'b'];

      return {pins: pins};
    }()));

    // Make wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(new LiveBlocks.Wire());
    }

    // Create logging event listeners
    var log = [];
    var listeners = {};
    (function(list) {

      for (var i = 0; i < list.length; i++) {

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
      }
    }(['connect', 'disconnect']));

    // Register event listeners
    block.on('connect', listeners.connect);
    block.on('disconnect', listeners.disconnect);
    expect(log.length).toBe(0);

    // Connect pin "a"
    block.connect('a', wires[0]);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('connect');
    expect(log[0].arg.pin).toBe('a');
    expect(log[0].arg.wire).toBe(wires[0]);

    // Clear log
    log.length = 0;

    // Connect pin "a" again (redundant)
    block.connect('a', wires[0]);
    expect(log.length).toBe(0);

    // Connect pin "b"
    block.connect('b', wires[1]);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('connect');
    expect(log[0].arg.pin).toBe('b');
    expect(log[0].arg.wire).toBe(wires[1]);

    // Clear log
    log.length = 0;

    // Reconnect pin "a"
    block.connect('a', wires[1]);
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('disconnect');
    expect(log[0].arg.pin).toBe('a');
    expect(log[0].arg.wire).toBe(wires[0]);
    expect(log[1].event).toBe('connect');
    expect(log[1].arg.pin).toBe('a');
    expect(log[1].arg.wire).toBe(wires[1]);

    // Clear log
    log.length = 0;

    // Disconnect pin "b"
    block.disconnect('b');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('disconnect');
    expect(log[0].arg.pin).toBe('b');
    expect(log[0].arg.wire).toBe(wires[1]);
  });

  it('update() function does nothing', function() {

    // Make ramp block
    var block = new LiveBlocks
    .ClockedBlock((function(assertFiniteNumber) {

      var doFunc = function(input, output) {

        assertFiniteNumber(input.output);
        output.output = input.output + 1;
      };

      var pins = ['output'];

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make a wire
    var wire = new LiveBlocks.Wire();
    wire.value(0);

    // Connect block to wire
    block.connect('output', wire);

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Set clock on blocks
    block.clock(clock);

    // Test stimulus
    block.update();
    expect(wire.value()).toBe(0);

    // Test stimulus
    clock.tickTock();
    expect(wire.value()).toBe(1);

    // Test stimulus
    block.update();
    expect(wire.value()).toBe(1);
  });

  it('pins() iterator iterates over block pins', function() {

    // Make a block
    var block = new LiveBlocks.ClockedBlock((function() {

      var pins = ['a', 'b'];

      return {pins: pins};
    }()));

    // Make a wires
    var wireA = new LiveBlocks.Wire();

    // Connect wires to block
    block.connect('a', wireA);

    // Get pin iterator
    var it = block.pins();

    // Peek at next pin
    expect(it.peek().done).toBe(false);
    expect(it.peek().value.pin).toBe('a');
    expect(it.peek().value.wire).toBe(wireA);

    // Get next pin
    var pin = it.next().value;
    expect(pin.pin).toBe('a');
    expect(pin.wire).toBe(wireA);

    // Get next pin
    pin = it.next().value;
    expect(pin.pin).toBe('b');
    expect(pin.wire).toBeUndefined();

    // We are at the end of the iterator
    expect(it.peek().done).toBe(true);
    expect(it.peek().value).toBeUndefined();
    expect(it.next().done).toBe(true);
    expect(it.next().value).toBeUndefined();

    // Reset iterator
    it.reset();

    // Peek at next pin
    expect(it.peek().done).toBe(false);
    expect(it.peek().value.pin).toBe('a');
    expect(it.peek().value.wire).toBe(wireA);

    // Disconnect wire
    // Iterator should not change
    // Need to get a new iterator to see latest pins
    block.disconnect('a');
    expect(it.peek().done).toBe(false);
    expect(it.peek().value.pin).toBe('a');
    expect(it.peek().value.wire).toBe(wireA);

    // Get new iterator
    it = block.pins();
    expect(it.peek().done).toBe(false);
    expect(it.peek().value.pin).toBe('a');
    expect(it.peek().value.wire).toBeUndefined();
  });

  it('clock() and unsetClock() work', function() {

    // Make a block
    var block = new LiveBlocks.ClockedBlock((function() {

      var doFunc = function(input, output) {

        output.output = input.output + 1;
      };

      var pins = ['output'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make some clocks
    var clocks = [];
    for (var i = 0; i < 2; i++) {

      clocks.push(new LiveBlocks.Clock());
    }

    // Make a wire
    var wire = new LiveBlocks.Wire();
    wire.value(0);

    // Connect wire to block
    block.connect('output', wire);

    // Test stimulus
    block.clock(clocks[0]);
    expect(wire.value()).toBe(0);
    expect(block.clock()).toBe(clocks[0]);

    // Test stimulus (redundant)
    block.clock(clocks[0]);

    // Block should only respond to clock 0
    clocks[0].tickTock();
    expect(wire.value()).toBe(1);
    clocks[1].tickTock();
    expect(wire.value()).toBe(1);

    // Test stimulus
    block.clock(clocks[1]);
    expect(block.clock()).toBe(clocks[1]);

    // Block should only respond to clock 1
    clocks[0].tickTock();
    expect(wire.value()).toBe(1);
    clocks[1].tickTock();
    expect(wire.value()).toBe(2);

    // Test stimulus
    block.unsetClock();
    expect(block.clock()).toBeUndefined();

    // Block should not respond to either clock
    clocks[0].tickTock();
    expect(wire.value()).toBe(2);
    clocks[1].tickTock();
    expect(wire.value()).toBe(2);
  });

  it('fires "tick", "tock", and "error" events', function() {

    // Make ramp block
    var block = new LiveBlocks
    .ClockedBlock((function(assertFiniteNumber) {

      var doFunc = function(input, output) {

        assertFiniteNumber(input.output);
        output.output = input.output + 1;
      };

      var pins = ['output'];

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make a wire
    var wire = new LiveBlocks.Wire();
    wire.value(0);

    // Connect block to wire
    block.connect('output', wire);

    // Make a clock
    var clock = new LiveBlocks.Clock();

    // Set clock on blocks
    block.clock(clock);

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
    }(['tick', 'tock', 'error']));

    // Check initial condition
    expect(log.length).toBe(0);

    // Test stimulus
    clock.tickTock();
    expect(wire.value()).toBe(1);
    expect(log.length).toBe(2);
    expect(log[0]).toEqual({event: 'tick'});
    expect(log[1]).toEqual({event: 'tock'});

    // Clear log
    log.length = 0;

    // Set invalid value on wire
    wire.value('a');
    expect(log.length).toBe(0);

    // Test stimulus
    clock.tickTock();
    expect(log.length).toBe(2);
    expect(log[0]).toEqual({event: 'tick'});
    expect(log[1].event).toBe('error');
    expect(log[1].arg.message).toBe('a must be a number');

    // Clear log
    log.length = 0;

    // Set valid value on wire
    wire.value(3);
    expect(log.length).toBe(0);

    // Test stimulus
    clock.tickTock();
    expect(wire.value()).toBe(4);
    expect(log.length).toBe(2);
    expect(log[0]).toEqual({event: 'tick'});
    expect(log[1]).toEqual({event: 'tock'});
  });
});

