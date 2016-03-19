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

      var same = function(objectA, objectB) {

        // Compare with ===, but let NaN === NaN be true
        if (objectA !== objectA) {

          return objectB !== objectB;
        }
        else {

          return objectA === objectB;
        }
      };

      var equalTo = function(value) {

        if (isArray(value) && isArray(this._value)) {

          if (value.length === this._value.length) {

            for (var i = 0; i < value.length; i++) {

              if (!same(value[i], this._value[i])) {

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

          return same(this._value, value);
        }
      };

      return function() {

        var wire = new Wire();
        wire.equalTo = equalTo;
        wire.value([]);
        return wire;
      };
    }(host.Array.isArray, LiveBlocks.Wire));
  });

  it('integration test', function() {

    // Create circuit factory
    var factory = (function(Wire, plusOneFactory) {

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

    // Create array repeat box
    var block = new LiveBlocks.ArrayRepeatBox({
      factory: factory,
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
});

