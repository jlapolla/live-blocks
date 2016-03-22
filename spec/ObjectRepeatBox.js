'use strict';

describe('ObjectRepeatBox class', function() {

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  // Skip test if ObjectRepeatBox is not exposed
  if (!LiveBlocks.ObjectRepeatBox) {

    return;
  }

  var assertFiniteNumber;
  var plusOneFactory;
  var plusOneCircuitFactory;
  var objectWireFactory;
  beforeEach(function() {

    assertFiniteNumber = (function(isFinite, Error) {

      return function(num) {

        if (!(typeof num === 'number' && isFinite(num))) {

          throw new Error(num + ' must be a number');
        }
      };
    }(host.isFinite, host.Error));

    plusOneFactory = (function(ImmediateBlock,
      assertFiniteNumber) {

      var toOutput = function(input, output) {

        assertFiniteNumber(input.input);

        output.output = input.input + 1;
      };

      var toInput = function(input, output) {

        assertFiniteNumber(input.output);

        output.input = input.output - 1;
      };

      return function() {

        return new ImmediateBlock({
          pins: {
            input: toOutput,
            output: toInput,
          },
        });
      };
    }(LiveBlocks.ImmediateBlock,
      assertFiniteNumber));

    objectWireFactory = (function(isObject, Wire) {

      var equals = (function(isObject, hasOwnProperty) {

        var same = function(objectA, objectB) {

          // Compare with ===, but let NaN === NaN be true
          if (objectA !== objectA) {

            return objectB !== objectB;
          }
          else {

            return objectA === objectB;
          }
        };

        var equals;
        equals = function(objectA, objectB) {

          if (isObject(objectA) && isObject(objectB)) {

            for (var prop in objectA) {

              if (!(hasOwnProperty(objectB, prop)
                && equals(objectA[prop], objectB[prop]))) {

                return false
              }
            }

            for (var prop in objectB) {

              if (!hasOwnProperty(objectA, prop)) {

                return false;
              }
            }

            return true;
          }
          else {

            return same(objectB, objectA);
          }
        };

        return equals;
      }(isObject, LiveBlocks.hasOwnProperty));

      var equalTo = function(value) {

        return equals(this._value, value);
      };

      return function() {

        var wire = new Wire();
        wire.equalTo = equalTo;
        wire.value({});
        return wire;
      };
    }(LiveBlocks.isObject, LiveBlocks.Wire));

    plusOneCircuitFactory = (function(Wire, plusOneFactory) {

      // Create circuit factory
      return function() {

        var input = new Wire();
        var output = new Wire();

        var block = plusOneFactory();

        block.connect('input', input);
        block.connect('output', output);

        return {
          input: input,
          output: output,
        };
      };
    }(LiveBlocks.Wire, plusOneFactory));
  });

  it('integration test', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var input = objectWireFactory();
    var output = objectWireFactory();
    var innerWire = new LiveBlocks.Wire();

    // Connect wires to block
    block.connect('input', input);
    block.connect('output', output);

    // Block should not have error
    expect(block.error()).toBeUndefined();

    // Provide some input
    input.value({a: 1, b: 3, c: 2});
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 3, c: 2});
    expect(output.value()).toEqual({a: 2, b: 4, c: 3});

    // Connect directly to a block
    var innerBlock = block.block('b');
    innerWire.value(5);
    innerBlock.connect('input', innerWire);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 5, c: 2});
    expect(output.value()).toEqual({a: 2, b: 6, c: 3});
    expect(innerWire.value()).toBe(5);

    // Introduce an internal error
    innerWire.value('a');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 5, c: 2});
    expect(output.value()).toEqual({a: 2, b: 6, c: 3});
    expect(innerWire.value()).toBe('a');

    // Clear the internal error
    innerWire.value(5);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 5, c: 2});
    expect(output.value()).toEqual({a: 2, b: 6, c: 3});
    expect(innerWire.value()).toBe(5);

    // Introduce an external error
    input.value({a: 1, b: 'a', c: 2});
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 'a', c: 2});
    expect(output.value()).toEqual({a: 2, b: 6, c: 3});
    expect(innerWire.value()).toBe(5);

    // Clear the external error
    input.value({a: 1, b: 5, c: 2});
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 5, c: 2});
    expect(output.value()).toEqual({a: 2, b: 6, c: 3});
    expect(innerWire.value()).toBe(5);

    // Change inner wire from external wire
    input.value({a: 1, b: 7, c: 2});
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 7, c: 2});
    expect(output.value()).toEqual({a: 2, b: 8, c: 3});
    expect(innerWire.value()).toBe(7);

    // Remove internal block "b"
    expect(innerWire.connections().peek().done).toBe(false);
    input.value({a: 3});
    expect(innerWire.connections().peek().done).toBe(true);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 3});
    expect(output.value()).toEqual({a: 4});
    expect(innerWire.value()).toBe(7);

    // Set non-object input
    input.value('a');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual('a');
    expect(output.value()).toEqual({a: 4});
    expect(innerWire.value()).toBe(7);

    // Set empty object
    input.value({});
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({});
    expect(output.value()).toEqual({});
    expect(innerWire.value()).toBe(7);
  });

  it('integration test with nested ObjectRepeatBox', function() {

    // Create circuit factory
    var repeatCircuitFactory = (function(plusOneCircuitFactory,
      objectWireFactory,
      ObjectRepeatBox) {

      return function() {

        var block = new ObjectRepeatBox({
          factory: plusOneCircuitFactory,
        });

        var input = objectWireFactory();
        var output = objectWireFactory();

        block.connect('input', input);
        block.connect('output', output);

        var pins = {
          input: input,
          output: output,
        };
        return pins;
      };
    }(plusOneCircuitFactory,
      objectWireFactory,
      LiveBlocks.ObjectRepeatBox));

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: repeatCircuitFactory,
    });

    // Create wires
    var input = objectWireFactory();
    var output = objectWireFactory();
    var innerWire = new LiveBlocks.Wire();

    // Set initial wire values
    input.value({a: {}});
    output.value({a: {}});

    // Connect wires to pins
    block.connect('input', input);
    block.connect('output', output);

    // Check initial conditions
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: {}});
    expect(output.value()).toEqual({a: {}});

    // Provide some input
    input.value({
      a: {a: 1, b: 2, c: 3},
      b: {a: 6, b: 2, c: 4},
    });
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({
      a: {a: 1, b: 2, c: 3},
      b: {a: 6, b: 2, c: 4},
    });
    expect(output.value()).toEqual({
      a: {a: 2, b: 3, c: 4},
      b: {a: 7, b: 3, c: 5},
    });

    // Connect directly to a block. Change wire value from internal block
    // connection.
    var innerBlock = block.block('a');
    innerWire.value({a: 8, b: 4, c: 5, d: 3});
    innerBlock.connect('input', innerWire);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({
      a: {a: 8, b: 4, c: 5, d: 3},
      b: {a: 6, b: 2, c: 4},
    });
    expect(output.value()).toEqual({
      a: {a: 9, b: 5, c: 6, d: 4},
      b: {a: 7, b: 3, c: 5},
    });
    expect(innerWire.value()).toEqual({a: 8, b: 4, c: 5, d: 3});

    // Change value externally
    input.value({
      a: {a: 3, b: 4, c: 5, d: 6},
      b: {a: 5},
      c: {a: 2, b: 8, c: 3},
    });
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({
      a: {a: 3, b: 4, c: 5, d: 6},
      b: {a: 5},
      c: {a: 2, b: 8, c: 3},
    });
    expect(output.value()).toEqual({
      a: {a: 4, b: 5, c: 6, d: 7},
      b: {a: 6},
      c: {a: 3, b: 9, c: 4},
    });
    expect(innerWire.value()).toEqual({a: 3, b: 4, c: 5, d: 6});
  });

  it('throws error when connecting to a non-existent pin', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Connect to non-existent pin
    expect(function() {

      block.connect('x', wire);
    }).toThrowError('Pin "x" not found');
  });

  it('fires connect and disconnect events', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create logging event listeners
    var log = [];
    (function(list) {

      for (var i = 0; i < list.length; i++) {

        var listener = (function(eventName) {

          return function(arg) {

            // Create log object
            var obj = {event: eventName};
            if (arguments.length) {

              obj.arg = arg;
            }

            // Add log object to log
            log.push(obj);
          };
        }(list[i]));

        block.on(list[i], listener);
      }
    }(['connect', 'disconnect']));

    // Create wires
    var wires = [];
    for (var i = 0; i < 3; i++) {

      wires.push(objectWireFactory());
    }

    // Connect pin "input"
    block.connect('input', wires[0]);
    block.connect('input', wires[0]); // Redundant connect
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('connect');
    expect(log[0].arg.pin).toBe('input');
    expect(log[0].arg.wire).toBe(wires[0]);
    log.length = 0;

    // Connect pin "output"
    block.connect('output', wires[1]);
    block.connect('output', wires[1]); // Redundant connect
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('connect');
    expect(log[0].arg.pin).toBe('output');
    expect(log[0].arg.wire).toBe(wires[1]);
    log.length = 0;

    // Re-connect pin "output"
    block.connect('output', wires[2]);
    block.connect('output', wires[2]); // Redundant connect
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('disconnect');
    expect(log[0].arg.pin).toBe('output');
    expect(log[0].arg.wire).toBe(wires[1]);
    expect(log[1].event).toBe('connect');
    expect(log[1].arg.pin).toBe('output');
    expect(log[1].arg.wire).toBe(wires[2]);
    log.length = 0;

    // Disconnect pin "output"
    block.disconnect('output', wires[2]);
    block.disconnect('output', wires[2]); // Redundant disconnect
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('disconnect');
    expect(log[0].arg.pin).toBe('output');
    expect(log[0].arg.wire).toBe(wires[2]);
    log.length = 0;
  });

  it('fires update, success, and error events', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create logging event listeners
    var log = [];
    (function(list) {

      for (var i = 0; i < list.length; i++) {

        var listener = (function(eventName) {

          return function(arg) {

            // Create log object
            var obj = {event: eventName};
            if (arguments.length) {

              obj.arg = arg;
            }

            // Add log object to log
            log.push(obj);
          };
        }(list[i]));

        block.on(list[i], listener);
      }
    }(['update', 'success', 'error']));

    // Create wires
    var input = objectWireFactory();
    var output = objectWireFactory();

    // Connect wires
    block.connect('input', input);
    block.connect('output', output);
    log.length = 0;

    // Provide some input
    input.value({a: 1, b: 2});
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({a: 2, b: 3});
    log.length = 0;

    // Create error
    input.value({a: 'a', b: 'b'});
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual({a: 'a', b: 'b'});
    expect(output.value()).toEqual({a: 2, b: 3});
    log.length = 0;

    // Clear the error
    input.value({a: 1, b: 2});
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({a: 2, b: 3});
    log.length = 0;
  });

  it('indicates error when a pin value is not an object', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create logging event listeners
    var log = [];
    (function(list) {

      for (var i = 0; i < list.length; i++) {

        var listener = (function(eventName) {

          return function(arg) {

            // Create log object
            var obj = {event: eventName};
            if (arguments.length) {

              obj.arg = arg;
            }

            // Add log object to log
            log.push(obj);
          };
        }(list[i]));

        block.on(list[i], listener);
      }
    }(['update', 'success', 'error']));

    // Create wires
    var input = objectWireFactory();
    var output = objectWireFactory();

    // Connect wires
    block.connect('input', input);
    block.connect('output', output);
    log.length = 0;

    // Create error
    input.value('a');
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(block.error().message).toBe('Pin input must be an object');
    expect(input.value()).toEqual('a');
    expect(output.value()).toEqual({});
    log.length = 0;

    // Clear the error
    input.value({a: 1, b: 2});
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({a: 2, b: 3});
    log.length = 0;
  });

  it('reacts to internal wire updates', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create logging event listeners
    var log = [];
    (function(list) {

      for (var i = 0; i < list.length; i++) {

        var listener = (function(eventName) {

          return function(arg) {

            // Create log object
            var obj = {event: eventName};
            if (arguments.length) {

              obj.arg = arg;
            }

            // Add log object to log
            log.push(obj);
          };
        }(list[i]));

        block.on(list[i], listener);
      }
    }(['update', 'success', 'error']));

    // Create wires
    var input = objectWireFactory();
    var output = objectWireFactory();
    var innerInput = new LiveBlocks.Wire();
    var innerOutput = new LiveBlocks.Wire();

    // Connect wires
    block.connect('input', input);
    block.connect('output', output);

    // Set initial values
    input.value({a: 1, b: 2});
    innerInput.value(2);
    innerOutput.value(3);

    // Get inner block
    var innerBlock = block.block('b');
    innerBlock.connect('input', innerInput);
    innerBlock.connect('output', innerOutput);
    log.length = 0;

    // Check initial conditions
    expect(log.length).toBe(0);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({a: 2, b: 3});
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(2);
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Provide stimulus
    innerInput.value(4);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 4});
    expect(output.value()).toEqual({a: 2, b: 5});
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(4);
    expect(innerOutput.value()).toBe(5);
    log.length = 0;

    // Create error internally
    innerInput.value('a');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 4});
    expect(output.value()).toEqual({a: 2, b: 5});
    expect(innerBlock.error()).not.toBeUndefined();
    expect(innerInput.value()).toBe('a');
    expect(innerOutput.value()).toBe(5);
    log.length = 0;

    // Clear error internally
    innerInput.value(2);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({a: 2, b: 3});
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(2);
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Create error internally
    innerInput.value('a');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({a: 2, b: 3});
    expect(innerBlock.error()).not.toBeUndefined();
    expect(innerInput.value()).toBe('a');
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Clear error externally
    input.value({a: 1, b: 4});
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 4});
    expect(output.value()).toEqual({a: 2, b: 5});
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(4);
    expect(innerOutput.value()).toBe(5);
    log.length = 0;

    // Create error externally
    input.value({a: 1, b: 'a'});
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 'a'});
    expect(output.value()).toEqual({a: 2, b: 5});
    expect(innerBlock.error()).not.toBeUndefined();
    expect(innerInput.value()).toBe(4);
    expect(innerOutput.value()).toBe(5);
    log.length = 0;

    // Clear error internally
    innerInput.value(2);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({a: 2, b: 3});
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(2);
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Create error externally
    input.value({a: 1, b: 'a'});
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 'a'});
    expect(output.value()).toEqual({a: 2, b: 3});
    expect(innerBlock.error()).not.toBeUndefined();
    expect(innerInput.value()).toBe(2);
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Clear error externally
    input.value({a: 1, b: 4});
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 4});
    expect(output.value()).toEqual({a: 2, b: 5});
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(4);
    expect(innerOutput.value()).toBe(5);
    log.length = 0;
  });

  it('pins() iterator iterates over block pins', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(objectWireFactory());
    }

    // Connect wires
    block.connect('input', wires[0]);

    // Get pins iterator
    var it = block.pins();

    // Connect last wire (should not show up in the iterator)
    block.connect('output', wires[1]);

    // Run through iterator
    expect(it.peek().value.pin).toBe('input');
    expect(it.peek().value.wire).toBe(wires[0]);
    it.next();
    expect(it.peek().value.pin).toBe('output');
    expect(it.peek().value.wire).toBeUndefined();
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);

    // Reset and run through iterator again
    it.reset();
    expect(it.peek().value.pin).toBe('input');
    expect(it.peek().value.wire).toBe(wires[0]);
    it.next();
    expect(it.peek().value.pin).toBe('output');
    expect(it.peek().value.wire).toBeUndefined();
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);

    // Get a new iterator
    it = block.pins();

    // Run through iterator
    expect(it.peek().value.pin).toBe('input');
    expect(it.peek().value.wire).toBe(wires[0]);
    it.next();
    expect(it.peek().value.pin).toBe('output');
    expect(it.peek().value.wire).toBe(wires[1]);
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);
  });

  it('blocks() iterator iterates over internal blocks', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(objectWireFactory());
    }

    // Connect wires
    block.connect('input', wires[0]);
    block.connect('output', wires[1]);

    // Set initial value
    wires[0].value({a: 1});

    // Get block iterator
    var it = block.blocks();

    // Set new value (will not be reflected in block iterator yet)
    wires[0].value({a: 1, b: 2});

    // Run through iterator
    expect(it.peek().value.block).not.toBeUndefined();
    expect(it.peek().value.key).toBe('a');
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);

    // Reset and run through iterator again
    it.reset();
    expect(it.peek().value.block).not.toBeUndefined();
    expect(it.peek().value.key).toBe('a');
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);

    // Get new iterator
    it = block.blocks();

    // Run through iterator
    expect(it.peek().value.block).not.toBeUndefined();
    expect(it.peek().value.key).toBe('a');
    it.next();
    expect(it.peek().value.block).not.toBeUndefined();
    expect(it.peek().value.key).toBe('b');
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);
  });

  it('block() selector retrieves the desired block', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(objectWireFactory());
    }

    // Connect wires
    block.connect('input', wires[0]);
    block.connect('output', wires[1]);

    // Set initial value
    wires[0].value({a: 1, b: 2});

    // Retrieve some blocks
    expect(block.block('a')).not.toBeUndefined();
    expect(block.block('b')).not.toBeUndefined();
    expect(block.block('c')).toBeUndefined();
  });

  it('recycles existing blocks when possible', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(objectWireFactory());
    }

    // Connect wires
    block.connect('input', wires[0]);
    block.connect('output', wires[1]);

    // Set initial value
    wires[0].value({a: 1, b: 2});

    // Store blocks for later
    var blockA = block.block('a');
    var blockB = block.block('b');

    // Retrieve blocks
    expect(block.block('a')).toBe(blockA);
    expect(block.block('b')).toBe(blockB);
    expect(block.block('c')).toBeUndefined();

    // Remove a block. Notice blockA is recycled.
    wires[0].value({a: 2});
    expect(block.block('a')).toBe(blockA);
    expect(block.block('b')).toBeUndefined();
    expect(block.block('c')).toBeUndefined();

    // Add a block. Notice that this is a new block (not the same object as our
    // stored blockB).
    wires[0].value({a: 1, b: 2});
    expect(block.block('a')).toBe(blockA);
    expect(block.block('b')).not.toBe(blockB);
    expect(block.block('b')).not.toBeUndefined();
    expect(block.block('c')).toBeUndefined();
  });

  it('handles unconnected wires gracefully', function() {

    // Create block
    var block = new LiveBlocks.ObjectRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var input = objectWireFactory();
    var output = objectWireFactory();

    // Set initial value on input
    input.value({a: 1, b: 2});

    // Connect input only
    block.connect('input', input);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 1, b: 2});
    expect(output.value()).toEqual({});

    // Get inner wire connection
    var innerWire = new LiveBlocks.Wire();
    innerWire.value(3);
    block.block('a').connect('input', innerWire);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual({a: 3, b: 2});
    expect(output.value()).toEqual({});
    expect(innerWire.value()).toBe(3);
  });

  it('detects infinite loops', function() {

    // Create block
    var block = (function() {

      var toOutput = function(input, output) {

        output.output = !input.input;
      };

      var factory = function() {

        var block = new LiveBlocks.ImmediateBlock({
          pins: {
            input: toOutput,
            output: toOutput,
          },
        });

        var input = new LiveBlocks.Wire();
        var output = new LiveBlocks.Wire();

        block.connect('input', input);
        block.connect('output', output);

        return {
          input: input,
          output: output,
        };
      };

      return new LiveBlocks.ObjectRepeatBox({
        factory: factory,
      });
    }());

    // Create alwaysFalse block
    var alwaysFalse = (function() {

      var func = function(input, output) {

        output.output = {a: false};
      };

      return new LiveBlocks.ImmediateBlock({
        pins: {
          output: func,
        },
      });
    }());

    // Create wires
    var input = objectWireFactory();
    var output = objectWireFactory();

    // Connect wires to pins
    block.connect('input', input);
    block.connect('output', output);

    // Set initial value
    input.value({a: true});
    expect(output.value()).toEqual({a: false});

    // Connect alwaysFalse block
    alwaysFalse.connect('output', output);

    // Create infinite loop
    var triggerLoop = function() {

      input.value({a: true});
      input.value({a: false});
    };

    // Check initial max iterations
    expect(LiveBlocks.ObjectRepeatBox.maxIterations()).toBe(100);

    // Set low max iterations, so the test runs quickly
    LiveBlocks.ObjectRepeatBox.maxIterations(10);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 10 iterations');

    // Set new maxIterations
    LiveBlocks.ObjectRepeatBox.maxIterations(20);
    expect(LiveBlocks.ObjectRepeatBox.maxIterations()).toBe(20);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 20 iterations');
  });
});

