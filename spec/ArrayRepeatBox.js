'use strict';

describe('ArrayRepeatBox class', function() {

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  // Skip test if ArrayRepeatBox is not exposed
  if (!LiveBlocks.ArrayRepeatBox) {

    return;
  }

  var assertFiniteNumber;
  var plusOneFactory;
  var timesTwoFactory;
  var plusOneCircuitFactory;
  var arrayWireFactory;
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

    timesTwoFactory = (function(ImmediateBlock,
      assertFiniteNumber) {

      var toOutput = function(input, output) {

        assertFiniteNumber(input.input);

        output.output = input.input * 2;
      };

      var toInput = function(input, outpu) {

        assertFiniteNumber(input.output);

        output.input = input.output / 2;
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

    arrayWireFactory = (function(isArray, Wire) {

      var equals = (function(isArray) {

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

          if (isArray(objectA) && isArray(objectB)) {

            if (objectA.length === objectB.length) {

              for (var i = 0; i < objectA.length; i++) {

                if (!equals(objectA[i], objectB[i])) {

                  return false;
                }
              }

              return true;
            }
            else {

              return false;
            }
          }
          else {

            return same(objectB, objectA);
          }
        };

        return equals;
      }(isArray));

      var equalTo = function(value) {

        return equals(this._value, value);
      };

      return function() {

        var wire = new Wire();
        wire.equalTo = equalTo;
        wire.value([]);
        return wire;
      };
    }(host.Array.isArray, LiveBlocks.Wire));

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
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var input = arrayWireFactory();
    var output = arrayWireFactory();
    var innerWire = new LiveBlocks.Wire();

    // Connect wires to block
    block.connect('input', input);
    block.connect('output', output);

    // Block should not have error
    expect(block.error()).toBeUndefined();

    // Provide some input
    input.value([1, 3, 2]);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 3, 2]);
    expect(output.value()).toEqual([2, 4, 3]);

    // Connect directly to a block
    var innerBlock = block.block(1);
    innerWire.value(5);
    innerBlock.connect('input', innerWire);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 5, 2]);
    expect(output.value()).toEqual([2, 6, 3]);
    expect(innerWire.value()).toBe(5);

    // Introduce an internal error
    innerWire.value('a');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual([1, 5, 2]);
    expect(output.value()).toEqual([2, 6, 3]);
    expect(innerWire.value()).toBe('a');

    // Clear the internal error
    innerWire.value(5);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 5, 2]);
    expect(output.value()).toEqual([2, 6, 3]);
    expect(innerWire.value()).toBe(5);

    // Introduce an external error
    input.value([1, 'a', 2]);
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual([1, 'a', 2]);
    expect(output.value()).toEqual([2, 6, 3]);
    expect(innerWire.value()).toBe(5);

    // Clear the external error
    input.value([1, 5, 2]);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 5, 2]);
    expect(output.value()).toEqual([2, 6, 3]);
    expect(innerWire.value()).toBe(5);

    // Change inner wire from external wire
    input.value([1, 7, 2]);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 7, 2]);
    expect(output.value()).toEqual([2, 8, 3]);
    expect(innerWire.value()).toBe(7);

    // Remove internal block 1
    expect(innerWire.connections().peek().done).toBe(false);
    input.value([3]);
    expect(innerWire.connections().peek().done).toBe(true);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([3]);
    expect(output.value()).toEqual([4]);
    expect(innerWire.value()).toBe(7);

    // Set non-array input
    input.value('a');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual('a');
    expect(output.value()).toEqual([4]);
    expect(innerWire.value()).toBe(7);

    // Set empty array
    input.value([]);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([]);
    expect(output.value()).toEqual([]);
    expect(innerWire.value()).toBe(7);
  });

  it('integration test with nested ArrayRepeatBox', function() {

    // Create circuit factory
    var repeatCircuitFactory = (function(plusOneCircuitFactory,
      arrayWireFactory,
      ArrayRepeatBox) {

      return function() {

        var block = new ArrayRepeatBox({
          factory: plusOneCircuitFactory,
        });

        var input = arrayWireFactory();
        var output = arrayWireFactory();

        block.connect('input', input);
        block.connect('output', output);

        var pins = {
          input: input,
          output: output,
        };
        return pins;
      };
    }(plusOneCircuitFactory,
      arrayWireFactory,
      LiveBlocks.ArrayRepeatBox));

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: repeatCircuitFactory,
    });

    // Create wires
    var input = arrayWireFactory();
    var output = arrayWireFactory();
    var innerWire = new LiveBlocks.Wire();

    // Set initial wire values
    input.value([[]]);
    output.value([[]]);

    // Connect wires to pins
    block.connect('input', input);
    block.connect('output', output);

    // Check initial conditions
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([[]]);
    expect(output.value()).toEqual([[]]);

    // Provide some input
    input.value([
      [1, 3, 2],
      [6, 2, 4],
    ]);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([
      [1, 3, 2],
      [6, 2, 4],
    ]);
    expect(output.value()).toEqual([
      [2, 4, 3],
      [7, 3, 5],
    ]);

    // Connect directly to a block. Change wire value from internal block
    // connection.
    var innerBlock = block.block(0);
    innerWire.value([8, 4, 5, 3]);
    innerBlock.connect('input', innerWire);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([
      [8, 4, 5, 3],
      [6, 2, 4],
    ]);
    expect(output.value()).toEqual([
      [9, 5, 6, 4],
      [7, 3, 5],
    ]);
    expect(innerWire.value()).toEqual([8, 4, 5, 3]);

    // Change value externally
    input.value([
      [3, 4, 5, 6],
      [5],
      [2, 8, 3],
    ]);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([
      [3, 4, 5, 6],
      [5],
      [2, 8, 3],
    ]);
    expect(output.value()).toEqual([
      [4, 5, 6, 7],
      [6],
      [3, 9, 4],
    ]);
    expect(innerWire.value()).toEqual([3, 4, 5, 6]);
  });

  it('throws error when connecting to a non-existent pin', function() {

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
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
    var block = new LiveBlocks.ArrayRepeatBox({
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

      wires.push(arrayWireFactory());
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
    var block = new LiveBlocks.ArrayRepeatBox({
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
    var input = arrayWireFactory();
    var output = arrayWireFactory();

    // Connect wires
    block.connect('input', input);
    block.connect('output', output);
    log.length = 0;

    // Provide some input
    input.value([1, 2]);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([2, 3]);
    log.length = 0;

    // Create error
    input.value(['a', 'b']);
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual(['a', 'b']);
    expect(output.value()).toEqual([2, 3]);
    log.length = 0;

    // Clear the error
    input.value([1, 2]);
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([2, 3]);
    log.length = 0;
  });

  it('indicates error when a pin value is not an array', function() {

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
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
    var input = arrayWireFactory();
    var output = arrayWireFactory();

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
    expect(block.error().message).toBe('Pin input must be an array');
    expect(input.value()).toEqual('a');
    expect(output.value()).toEqual([]);
    log.length = 0;

    // Clear the error
    input.value([1, 2]);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([2, 3]);
    log.length = 0;
  });

  it('reacts to internal wire updates', function() {

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
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
    var input = arrayWireFactory();
    var output = arrayWireFactory();
    var innerInput = new LiveBlocks.Wire();
    var innerOutput = new LiveBlocks.Wire();

    // Connect wires
    block.connect('input', input);
    block.connect('output', output);

    // Set initial values
    input.value([1, 2]);
    innerInput.value(2);
    innerOutput.value(3);

    // Get inner block
    var innerBlock = block.block(1);
    innerBlock.connect('input', innerInput);
    innerBlock.connect('output', innerOutput);
    log.length = 0;

    // Check initial conditions
    expect(log.length).toBe(0);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([2, 3]);
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
    expect(input.value()).toEqual([1, 4]);
    expect(output.value()).toEqual([2, 5]);
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(4);
    expect(innerOutput.value()).toBe(5);
    log.length = 0;

    // Create error internally
    innerInput.value('a');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual([1, 4]);
    expect(output.value()).toEqual([2, 5]);
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
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([2, 3]);
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(2);
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Create error internally
    innerInput.value('a');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([2, 3]);
    expect(innerBlock.error()).not.toBeUndefined();
    expect(innerInput.value()).toBe('a');
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Clear error externally
    input.value([1, 4]);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 4]);
    expect(output.value()).toEqual([2, 5]);
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(4);
    expect(innerOutput.value()).toBe(5);
    log.length = 0;

    // Create error externally
    input.value([1, 'a']);
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual([1, 'a']);
    expect(output.value()).toEqual([2, 5]);
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
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([2, 3]);
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(2);
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Create error externally
    input.value([1, 'a']);
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('error');
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toEqual([1, 'a']);
    expect(output.value()).toEqual([2, 3]);
    expect(innerBlock.error()).not.toBeUndefined();
    expect(innerInput.value()).toBe(2);
    expect(innerOutput.value()).toBe(3);
    log.length = 0;

    // Clear error externally
    input.value([1, 4]);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[0].arg.pin).toBe('input');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[2].arg.pin).toBe('output');
    expect(log[3].event).toBe('success');
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 4]);
    expect(output.value()).toEqual([2, 5]);
    expect(innerBlock.error()).toBeUndefined();
    expect(innerInput.value()).toBe(4);
    expect(innerOutput.value()).toBe(5);
    log.length = 0;
  });

  it('pins() iterator iterates over block pins', function() {

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(arrayWireFactory());
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
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(arrayWireFactory());
    }

    // Connect wires
    block.connect('input', wires[0]);
    block.connect('output', wires[1]);

    // Set initial value
    wires[0].value([1]);

    // Get block iterator
    var it = block.blocks();

    // Set new value (will not be reflected in block iterator yet)
    wires[0].value([1, 2]);

    // Run through iterator
    expect(it.peek().value).not.toBeUndefined();
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);

    // Reset and run through iterator again
    it.reset();
    expect(it.peek().value).not.toBeUndefined();
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);

    // Get new iterator
    it = block.blocks();

    // Run through iterator
    expect(it.peek().value).not.toBeUndefined();
    it.next();
    expect(it.peek().value).not.toBeUndefined();
    it.next();
    expect(it.peek().value).toBeUndefined();
    expect(it.peek().done).toBe(true);
  });

  it('block() selector retrieves the desired block', function() {

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(arrayWireFactory());
    }

    // Connect wires
    block.connect('input', wires[0]);
    block.connect('output', wires[1]);

    // Set initial value
    wires[0].value([1, 2]);

    // Retrieve some blocks
    expect(block.block(0)).not.toBeUndefined();
    expect(block.block(1)).not.toBeUndefined();
    expect(block.block(2)).toBeUndefined();
  });

  it('recycles existing blocks when possible', function() {

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(arrayWireFactory());
    }

    // Connect wires
    block.connect('input', wires[0]);
    block.connect('output', wires[1]);

    // Set initial value
    wires[0].value([1, 2]);

    // Store blocks for later
    var block0 = block.block(0);
    var block1 = block.block(1);

    // Retrieve blocks
    expect(block.block(0)).toBe(block0);
    expect(block.block(1)).toBe(block1);
    expect(block.block(2)).toBeUndefined();

    // Remove a block. Notice block0 is recycled.
    wires[0].value([2]);
    expect(block.block(0)).toBe(block0);
    expect(block.block(1)).toBeUndefined();
    expect(block.block(2)).toBeUndefined();

    // Add a block. Notice that this is a new block (not the same object as our
    // stored block1).
    wires[0].value([1, 2]);
    expect(block.block(0)).toBe(block0);
    expect(block.block(1)).not.toBe(block1);
    expect(block.block(1)).not.toBeUndefined();
    expect(block.block(2)).toBeUndefined();
  });

  it('handles unconnected wires gracefully', function() {

    // Create block
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: plusOneCircuitFactory,
    });

    // Create wires
    var input = arrayWireFactory();
    var output = arrayWireFactory();

    // Set initial value on input
    input.value([1, 2]);

    // Connect input only
    block.connect('input', input);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([1, 2]);
    expect(output.value()).toEqual([]);

    // Get inner wire connection
    var innerWire = new LiveBlocks.Wire();
    innerWire.value(3);
    block.block(0).connect('input', innerWire);
    expect(block.error()).toBeUndefined();
    expect(input.value()).toEqual([3, 2]);
    expect(output.value()).toEqual([]);
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

      return new LiveBlocks.ArrayRepeatBox({
        factory: factory,
      });
    }());

    // Create alwaysFalse block
    var alwaysFalse = (function() {

      var func = function(input, output) {

        output.output = [false];
      };

      return new LiveBlocks.ImmediateBlock({
        pins: {
          output: func,
        },
      });
    }());

    // Create wires
    var input = arrayWireFactory();
    var output = arrayWireFactory();

    // Connect wires to pins
    block.connect('input', input);
    block.connect('output', output);

    // Set initial value
    input.value([true]);
    expect(output.value()).toEqual([false]);

    // Connect alwaysFalse block
    alwaysFalse.connect('output', output);

    // Create infinite loop
    var triggerLoop = function() {

      input.value([true]);
      input.value([false]);
    };

    // Check initial max iterations
    expect(LiveBlocks.ArrayRepeatBox.maxIterations()).toBe(100);

    // Set low max iterations, so the test runs quickly
    LiveBlocks.ArrayRepeatBox.maxIterations(10);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 10 iterations');

    // Set new maxIterations
    LiveBlocks.ArrayRepeatBox.maxIterations(20);
    expect(LiveBlocks.ArrayRepeatBox.maxIterations()).toBe(20);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 20 iterations');
  });
});

