'use strict';

describe('SynchronousBlock class', function() {

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  // Skip test if SynchronousBlock is not exposed
  if (!LiveBlocks.SynchronousBlock) {

    return;
  }

  var assertFiniteNumber;
  var floatWire;
  beforeEach(function() {

    assertFiniteNumber = (function(isFinite, Error) {

      return function(num) {

        if (!(typeof num === 'number' && isFinite(num))) {

          throw new Error(num + ' must be a number');
        }
      };
    }(host.isFinite, host.Error));

    // Create a prototype floating point value wire
    floatWire = new LiveBlocks.Wire((function(Math, isFinite) {

      var abs = Math.abs;
      var epsilon = 1e-14;

      var equalTo = function(value) {

        if (
          typeof value === 'number'
          && typeof this._value === 'number'
          && isFinite(value)
          && isFinite(this._value)) {

          return abs(this._value - value) < epsilon;
        }
        else if (value !== value) {

          return this._value !== this._value;
        }
        else {

          return value === this._value;
        }
      };

      return {equalTo: equalTo};
    }(host.Math, host.isFinite)));
  });

  it('integration test with Clock class', function() {

    // Make ramp block
    var rampBlock = new LiveBlocks
    .SynchronousBlock((function(assertFiniteNumber) {

      var doFunc = function() {

        assertFiniteNumber(this.output);
        this.output = this.output + 1;
      };

      var pins = {
        output: true,
      };

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make an integrator block
    var integratorBlock = new LiveBlocks
    .SynchronousBlock((function(assertFiniteNumber) {

      var doFunc = function() {

        assertFiniteNumber(this.input);
        assertFiniteNumber(this.output);

        this.output = this.input + this.output;
      };

      var pins = {
        input: false,
        output: true,
      };

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make wires
    var wires = {
      ramp: new LiveBlocks.Wire({initialValue: 0}),
      integral: new LiveBlocks.Wire({initialValue: 0}),
    };

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
  });

  it('duplicates injected dependencies', function() {

    // Create do function and pins definition hash
    var doFunc = function() {};

    var pins = {
      a: {},
      b: undefined,
    };

    // Create a synchronous block
    var block = new LiveBlocks.SynchronousBlock({
      do: doFunc,
      pins: pins,
    });
    expect(block._pins).not.toBe(pins);
    expect(block._pins).toEqual({a: true, b: false});
    expect(block._do).toBe(doFunc);

    // Duplicate synchronous block
    var duplicate = block.duplicate();
    expect(duplicate._pins).not.toBe(block._pins);
    expect(duplicate._pins).toEqual({a: true, b: false});
    expect(duplicate._do).toBe(doFunc);
  });

  it('catches exceptions in the "do" function', function() {

    // Make ramp block
    var block = new LiveBlocks.SynchronousBlock((function(assertFiniteNumber) {

      var doFunc = function() {

        assertFiniteNumber(this.output);
        this.output = this.output + 1;
      };

      var pins = {
        output: true,
      };

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
    var block = new LiveBlocks.SynchronousBlock((function() {

      var pins = {
        'output': true,
      };

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
    var block = new LiveBlocks.SynchronousBlock((function() {

      var pins = {
        a: true,
        b: true,
      };

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
    .SynchronousBlock((function(assertFiniteNumber) {

      var doFunc = function() {

        assertFiniteNumber(this.output);
        this.output = this.output + 1;
      };

      var pins = {
        output: true,
      };

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make a wire
    var wire = new LiveBlocks.Wire({initialValue: 0});

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
    var block = new LiveBlocks.SynchronousBlock((function() {

      var pins = {
        a: true,
        b: true,
      };

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

  it('clock() and unsetClock() functions trigger events', function() {

    // Make a block
    var block = new LiveBlocks.SynchronousBlock((function() {

      var doFunc = function() {

        this.output = this.output + 1;
      };

      var pins = {
        output: true,
      };

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

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
    }(['setClock', 'unsetClock']));

    // Register event listeners
    block.on('setClock', listeners.setClock);
    block.on('unsetClock', listeners.unsetClock);
    expect(log.length).toBe(0);

    // Make some clocks
    var clocks = [];
    for (var i = 0; i < 2; i++) {

      clocks.push(new LiveBlocks.Clock());
    }

    // Make a wire
    var wire = new LiveBlocks.Wire({initialValue: 0});

    // Connect wire to block
    block.connect('output', wire);

    // Test stimulus
    block.clock(clocks[0]);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('setClock');
    expect(log[0].arg.clock).toBe(clocks[0]);
    expect(wire.value()).toBe(0);
    expect(block.clock()).toBe(clocks[0]);

    // Clear log
    log.length = 0;

    // Test stimulus (redundant)
    block.clock(clocks[0]);
    expect(log.length).toBe(0);

    // Block should only respond to clock 0
    clocks[0].tickTock();
    expect(wire.value()).toBe(1);
    clocks[1].tickTock();
    expect(wire.value()).toBe(1);

    // Test stimulus
    block.clock(clocks[1]);
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('unsetClock');
    expect(log[0].arg.clock).toBe(clocks[0]);
    expect(log[1].event).toBe('setClock');
    expect(log[1].arg.clock).toBe(clocks[1]);
    expect(block.clock()).toBe(clocks[1]);

    // Clear log
    log.length = 0;

    // Block should only respond to clock 1
    clocks[0].tickTock();
    expect(wire.value()).toBe(1);
    clocks[1].tickTock();
    expect(wire.value()).toBe(2);

    // Test stimulus
    block.unsetClock();
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('unsetClock');
    expect(log[0].arg.clock).toBe(clocks[1]);
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
    .SynchronousBlock((function(assertFiniteNumber) {

      var doFunc = function() {

        assertFiniteNumber(this.output);
        this.output = this.output + 1;
      };

      var pins = {
        output: true,
      };

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber)));

    // Make a wire
    var wire = new LiveBlocks.Wire({initialValue: 0});

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

