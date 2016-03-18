'use strict';

describe('ImmediateBlock class', function() {

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  // Skip test if ImmediateBlock is not exposed
  if (!LiveBlocks.ImmediateBlock) {

    return;
  }

  var assertFiniteNumber;
  var floatWireFactory;
  beforeEach(function() {

    assertFiniteNumber = (function(isFinite, Error) {

      return function(num) {

        if (!(typeof num === 'number' && isFinite(num))) {

          throw new Error(num + ' must be a number');
        }
      };
    }(host.isFinite, host.Error));

    // Create a prototype floating point value wire
    floatWireFactory = ((function(Math, isFinite) {

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

      return function() {

        // Override equalTo function
        var wire = new LiveBlocks.Wire();
        wire.equalTo = equalTo;
        return wire;
      };
    }(host.Math, host.isFinite)));
  });

  it('integration test with Wire class where a wire has multiple connections',
  function() {

    // Used to capture "this" in pin functions
    var thisArg = true;

    // Update log
    var log = [];

    // Make blocks
    var plusOne = new LiveBlocks.ImmediateBlock((function() {

      // Make constraint functions
      var smaller2bigger = function(input, output) {

        output.bigger = input.smaller + 1;
        log.push('smaller2bigger');

        // Copy out "this"
        thisArg = this;
      };

      var bigger2smaller = function(input, output) {

        output.smaller = input.bigger - 1;
        log.push('bigger2smaller');
      };

      // Return pin hash
      return {pins: {bigger: bigger2smaller, smaller: smaller2bigger}};
    }()));

    var timesTwo = new LiveBlocks.ImmediateBlock((function() {

      // Make constraint functions
      var half2double = function(input, output) {

        output.double = input.half * 2;
        log.push('half2double');
      };

      var double2half = function(input, output) {

        output.half = input.double / 2;
        log.push('double2half');
      };

      // Return pin hash
      return {pins: {half: half2double, double: double2half}};
    }()));

    // Make wires
    var wires = [];
    for (var i = 0; i < 3; i++) {

      wires.push(new LiveBlocks.Wire());
    }

    // Connect block properties to wires
    plusOne.connect('smaller', wires[0]);
    plusOne.connect('bigger', wires[1]);
    timesTwo.connect('half', wires[1]);
    timesTwo.connect('double', wires[2]);

    // Clear update log
    log.length = 0;

    // Set value on wires[0]
    wires[0].value(0);
    expect(wires[0].value()).toBe(0);
    expect(wires[1].value()).toBe(1);
    expect(wires[2].value()).toBe(2);
    expect(log).toEqual([
      'smaller2bigger',
      'half2double',
      'double2half',
      'bigger2smaller']);

    // Clear update log
    log.length = 0;

    // Set another value on wires[0]
    wires[0].value(2);
    expect(wires[0].value()).toBe(2);
    expect(wires[1].value()).toBe(3);
    expect(wires[2].value()).toBe(6);
    expect(log).toEqual([
      'smaller2bigger',
      'half2double',
      'double2half',
      'bigger2smaller']);

    // Clear update log
    log.length = 0;

    // Set value on wires[1]
    wires[1].value(0.5);
    expect(wires[0].value()).toBe(-0.5);
    expect(wires[1].value()).toBe(0.5);
    expect(wires[2].value()).toBe(1);
    expect(log).toEqual(['bigger2smaller',
      'smaller2bigger',
      'half2double',
      'double2half']);

    // Clear update log
    log.length = 0;

    // Set value on wires[2]
    wires[2].value(8);
    expect(wires[0].value()).toBe(3);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(8);
    expect(log).toEqual([
      'double2half',
      'bigger2smaller',
      'smaller2bigger',
      'half2double']);

    // Clear update log
    log.length = 0;

    // Disconnect pins
    timesTwo.disconnect('half');
    expect(log).toEqual(['half2double', 'double2half']);
    timesTwo.disconnect('double');
    expect(log).toEqual(['half2double', 'double2half', 'double2half']);

    // Clear update log
    log.length = 0;

    // Rewire blocks
    timesTwo.connect('half', wires[2]);
    timesTwo.connect('double', wires[1]);
    expect(wires[0].value()).toBe(3);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(2);
    expect(log).toEqual(['half2double', 'double2half', 'half2double']);

    // Verify that "this" is undefined in pin functions
    expect(thisArg).toBeUndefined();
  });

  it('integration test with Wire class where the ImmediateBlock'
  + 'has multiple inputs and outputs', function() {

    // Convert rectangular to polar coordinates
    var block = new LiveBlocks.ImmediateBlock(
    (function(Math, assertFiniteNumber) {

      var atan2 = Math.atan2;
      var cos = Math.cos;
      var sin = Math.sin;
      var sqrt = Math.sqrt;

      var rect2polar = function(input, output) {

        assertFiniteNumber(input.x);
        assertFiniteNumber(input.y);

        output.r = sqrt(input.x * input.x + input.y * input.y);
        output.theta = atan2(input.y, input.x);
      };

      var polar2rect = function(input, output) {

        assertFiniteNumber(input.r);
        assertFiniteNumber(input.theta);

        output.x = input.r * cos(input.theta);
        output.y = input.r * sin(input.theta);
      };

      var pins = {
        x: rect2polar,
        y: rect2polar,
        r: polar2rect,
        theta: polar2rect,
      };

      return {pins: pins};
    }(host.Math, assertFiniteNumber)));

    // Make wires
    var wires = {};
    (function(wireNames) {

      for (var i = 0; i < wireNames.length; i++) {

        wires[wireNames[i]] = floatWireFactory();
      }
    }(['x', 'y', 'r', 'theta']));

    // Register logging event listeners
    var log = [];
    block.on('update', function(pin) {

      log.push(pin.pin);
    });

    block.on('success', function() {

      log.push('success');
    });

    block.on('error', function() {

      log.push('error');
    });

    // Connect wires to block pins
    block.connect('x', wires.x);
    block.connect('y', wires.y);
    block.connect('r', wires.r);
    block.connect('theta', wires.theta);

    // Clear log
    log.length = 0;

    // Test input
    wires.x.value(1);
    expect(log).toEqual(['x', 'error']);
    expect(wires.x.equalTo(1)).toBe(true);
    expect(wires.y.value()).toBeUndefined();
    expect(wires.r.value()).toBeUndefined();
    expect(wires.theta.value()).toBeUndefined();
    expect(block.error()).not.toBeUndefined();

    // Test input
    wires.y.value(0);
    expect(wires.x.equalTo(1)).toBe(true);
    expect(wires.y.equalTo(0)).toBe(true);
    expect(wires.r.equalTo(1)).toBe(true);
    expect(wires.theta.equalTo(0)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Test input
    wires.r.value(2);
    expect(wires.x.equalTo(2)).toBe(true);
    expect(wires.y.equalTo(0)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(0)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Clear log
    log.length = 0;

    // Test input
    wires.theta.value(Math.PI / 2);
    expect(log).toEqual(['theta', 'success', 'x', 'success', 'y', 'success']);
    expect(wires.x.equalTo(0)).toBe(true);
    expect(wires.y.equalTo(2)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(Math.PI / 2)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Test input
    wires.theta.value(Math.PI * 15 / 4);
    expect(wires.x.equalTo(2 / Math.SQRT2)).toBe(true);
    expect(wires.y.equalTo(-2 / Math.SQRT2)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(-Math.PI / 4)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Test input
    wires.theta.value(undefined);
    expect(wires.x.equalTo(2 / Math.SQRT2)).toBe(true);
    expect(wires.y.equalTo(-2 / Math.SQRT2)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(undefined)).toBe(true);
    expect(wires.theta.value()).toBeUndefined();
    expect(block.error()).not.toBeUndefined();
  });

  it('integration test with read-only values', function() {

    // We will make a flip flop from two cross-coupled NOR gates

    // Make two NOR blocks
    var norFactory = ((function() {

      var func = function(input, output) {

        output.out = !(input.a || input.b);
      };

      return function() {

        var pins = {
          a: func,
          b: func,
          out: func,
        };

        return new LiveBlocks.ImmediateBlock({pins: pins});
      };
    }()));

    var norQ = norFactory();
    var norNotQ = norFactory();

    // Make some wires
    var R = new LiveBlocks.Wire();
    var S = new LiveBlocks.Wire();
    var Q = new LiveBlocks.Wire();
    var notQ = new LiveBlocks.Wire();

    // Connect blocks to wires
    norQ.connect('out', Q);
    norQ.connect('a', R);
    norQ.connect('b', notQ);
    norNotQ.connect('out', notQ);
    norNotQ.connect('a', Q);
    norNotQ.connect('b', S);

    // Set the flip flop
    R.value(false);
    S.value(true);
    S.value(false);
    expect(R.value()).toBe(false);
    expect(S.value()).toBe(false);
    expect(Q.value()).toBe(true);
    expect(notQ.value()).toBe(false);

    // Reset the flip flop
    R.value(true);
    R.value(false);
    expect(R.value()).toBe(false);
    expect(S.value()).toBe(false);
    expect(Q.value()).toBe(false);
    expect(notQ.value()).toBe(true);
  });

  it('disconnects pin from wire before connecting to a new wire', function() {

    // Create a block
    var block = new LiveBlocks.ImmediateBlock({pins: {x: function() {}}});

    // Create wires which log their binding events
    var log = [];
    var bindFn = (function(bind) {

      return function(block, prop) {

        // Log bind call
        log.push({function: 'bind', block: block, prop: prop});

        // Call through
        return bind.call(this, block, prop);
      };
    }(LiveBlocks.Wire.prototype.bind));
    var unbindFn = (function(unbind) {

      return function(block, prop) {

        // Log unbind call
        log.push({function: 'unbind', block: block, prop: prop});

        // Call through
        return unbind.call(this, block, prop);
      };
    }(LiveBlocks.Wire.prototype.unbind));
    var wires = [];
    for (var i = 0; i < 2; i++) {

      // Create wire
      var wire = new LiveBlocks.Wire();

      // Add logging bind and unbind functions
      wire.bind = bindFn;
      wire.unbind = unbindFn;

      // Add wire to wires list
      wires.push(wire);
    }

    // Connect block to wire 0
    block.connect('x', wires[0]);
    expect(log.length).toBe(1);
    expect(log[0].function).toBe('bind');
    expect(log[0].block).toBe(block);
    expect(log[0].prop).toBe('x');

    // Clear log
    log.length = 0;

    // Connect block to wire 1
    block.connect('x', wires[1]);
    expect(log.length).toBe(2);
    expect(log[0].function).toBe('unbind');
    expect(log[0].block).toBe(block);
    expect(log[0].prop).toBe('x');
    expect(log[1].function).toBe('bind');
    expect(log[1].block).toBe(block);
    expect(log[1].prop).toBe('x');
  });

  it('treats disconnected pin as undefined', function() {

    // Create a passthrough block
    var block = new LiveBlocks.ImmediateBlock({
      pins: {
        a: function(input, output) {

          // Copy "a" to "b"
          output.b = input.a;
        },

        b: function(input, output) {

          // Copy "b" to "a"
          output.a = input.b;
        },
      },
    });

    // Create wires
    var wireA = new LiveBlocks.Wire();
    var wireB = new LiveBlocks.Wire();

    // Set values on wires
    wireA.value('a');
    wireB.value('b');

    // Connect wires to block
    block.connect('a', wireA);
    block.connect('b', wireB);
    expect(wireA.value()).toBe('b');
    expect(wireB.value()).toBe('b');

    // Test stimulus
    wireA.value(undefined);
    expect(wireA.value()).toBeUndefined();
    expect(wireB.value()).toBeUndefined();

    // Test stimulus
    wireA.value('a');
    expect(wireA.value()).toBe('a');
    expect(wireB.value()).toBe('a');

    // Disconnect pin "b"
    block.disconnect('a');
    expect(wireA.value()).toBe('a');
    expect(wireB.value()).toBeUndefined();

    // Test stimulus
    wireA.value('b');
    expect(wireA.value()).toBe('b');
    expect(wireB.value()).toBeUndefined();
  });

  it('throws error when connecting to non-existent pin', function() {

    // Create a block with no pins
    var block = new LiveBlocks.ImmediateBlock({});

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Connect to non-existent pin
    expect(function() {

      block.connect('x', wire);
    }).toThrowError('Pin "x" not found');
  });

  it('catches exceptions in pin functions', function() {

    // Create a block that throws error
    var block = new LiveBlocks.ImmediateBlock({
      pins: {
        a: function(input, output) {

          // Throw error if "a" is not a number
          if (typeof input.a !== 'number') {

            throw new TypeError('Pin "a" must be a number');
          }

          // Copy "a" to "b"
          output.b = input.a;
        },

        b: function(input, output) {

          // Throw error if "b" is not a number
          if (typeof input.b !== 'number') {

            throw new TypeError('Pin "b" must be a number');
          }

          // Copy "b" to "a"
          output.a = input.b;
        },
      },
    });

    // Create wires
    var wireA = new LiveBlocks.Wire();
    var wireB = new LiveBlocks.Wire();

    // Connect wires to block
    block.connect('a', wireA);
    block.connect('b', wireB);
    expect(block.error().message).toBe('Pin "b" must be a number');

    // Clear error
    wireA.value(1);
    expect(block.error()).toBeUndefined();
    expect(wireB.value()).toBe(1);

    // Reset error
    wireA.value(undefined);
    expect(block.error().message).toBe('Pin "a" must be a number');
  });

  it('fires events on update, success, and error', function() {

    // Create a block that throws error
    var block = new LiveBlocks.ImmediateBlock({
      pins: {
        a: function(input, output) {

          // Throw error if "a" is not a number
          if (typeof input.a !== 'number') {

            throw new TypeError('Pin "a" must be a number');
          }

          // Copy "a" to "b"
          output.b = input.a;
        },

        b: function(input, output) {

          // Throw error if "b" is not a number
          if (typeof input.b !== 'number') {

            throw new TypeError('Pin "b" must be a number');
          }

          // Copy "b" to "a"
          output.a = input.b;
        },
      },
    });

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
    }(['update', 'success', 'error']));

    // Attach event listeners
    block.on('update', listeners.update);
    block.on('success', listeners.success);
    block.on('error', listeners.error);

    // Create wires
    var wireA = new LiveBlocks.Wire();
    var wireB = new LiveBlocks.Wire();

    // Connect wireA to block
    block.connect('a', wireA);
    expect(log[0].event).toBe('update');
    expect(log[0].arg).toEqual({pin: 'a', value: undefined});
    expect(log[1].event).toBe('error');
    expect(log[1].arg.message).toBe('Pin "a" must be a number');
    expect(log.length).toBe(2);

    // Clear log
    log.length = 0;

    // Connect wireB to block
    block.connect('b', wireB);
    expect(log[0].event).toBe('update');
    expect(log[0].arg).toEqual({pin: 'b', value: undefined});
    expect(log[1].event).toBe('error');
    expect(log[1].arg.message).toBe('Pin "b" must be a number');
    expect(log.length).toBe(2);

    // Clear log
    log.length = 0;

    // Clear error
    wireA.value(1);
    expect(log[0].event).toBe('update');
    expect(log[0].arg).toEqual({pin: 'a', value: 1});
    expect(log[1].event).toBe('success');
    expect(log[1].arg).toBeUndefined();
    expect(log[2].event).toBe('update');
    expect(log[2].arg).toEqual({pin: 'b', value: 1});
    expect(log[3].event).toBe('success');
    expect(log[3].arg).toBeUndefined();
    expect(log.length).toBe(4);
  });

  it('fires events on pin connect and disconnect', function() {

    // Create a block
    var noop = function() {};

    var block = new LiveBlocks.ImmediateBlock({pins: {a: noop, b: noop}});

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

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(new LiveBlocks.Wire());
    }

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

  it('pins() iterator iterates over block pins', function() {

    // Create a block that throws error
    var block = new LiveBlocks.ImmediateBlock((function() {

      var noop = function() {};

      var pins = {a: noop, b: noop};
      return {pins: pins};
    }()));

    // Create wires
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

  it('detects infinite loops', function() {

    // Create a circuit that will make an infinite loop
    var passThrough = (function() {

      var toOutput = function(input, output) {

        output.output = input.input;
      };

      return new LiveBlocks.ImmediateBlock({
        pins: {
          input: toOutput,
          output: toOutput,
        },
      });
    }());

    var alwaysFalse = (function() {

      var toOutput = function(input, output) {

        output.output = false;
      };

      return new LiveBlocks.ImmediateBlock({
        pins: {
          output: toOutput,
        },
      });
    }());

    // Create wires
    var input = new LiveBlocks.Wire();
    var output = new LiveBlocks.Wire();

    // Connect wires to passThrough block
    passThrough.connect('input', input);
    passThrough.connect('output', output);

    // Set initial value
    input.value(false);
    expect(output.value()).toBe(false);

    // Connect alwaysFalse block
    alwaysFalse.connect('output', output);

    // Create infinite loop
    var triggerLoop = function() {

      input.value(false);
      input.value(true);
    };

    // Check initial max iterations
    expect(LiveBlocks.ImmediateBlock.maxIterations()).toBe(100);

    // Set low max iterations, so the test runs quickly
    LiveBlocks.ImmediateBlock.maxIterations(10);
    expect(LiveBlocks.ImmediateBlock.maxIterations()).toBe(10);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 10 iterations');

    // Set new maxIterations
    LiveBlocks.ImmediateBlock.maxIterations(20);
    expect(LiveBlocks.ImmediateBlock.maxIterations()).toBe(20);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 20 iterations');
  });
});

