'use strict';

describe('TimedBlock class', function() {

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  // Skip test if TimedBlock is not exposed
  if (!LiveBlocks.TimedBlock) {

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

  it('integration test with ManualTimer class', function() {

    // Make block that ramps a value
    var block = new LiveBlocks.TimedBlock((function(assertFiniteNumber, hasOwnProperty, Math){

      var abs = Math.abs;

      var nextStep = function(input, output, previous) {

        // Increment output by another step
        output.output = input.output + (input.input - input.output) / input.stepsLeft;

        // Check for overshoot
        if (abs(output.output - input.output) > abs(input.input - input.output)) {

          output.output = input.input;
        }

        // Update stepsLeft
        output.stepsLeft = input.stepsLeft - 1;

        // Request tick if we have steps left
        if (output.stepsLeft) {

          return true;
        }
        else {

          return;
        }
      };

      var doFunc = function(input, output, previous) {

        assertFiniteNumber(input.input);
        assertFiniteNumber(input.output);
        assertFiniteNumber(input.steps);
        assertFiniteNumber(input.stepsLeft);

        // Handle requested tick
        if (input.input === previous.input
          && input.output === previous.output
          && input.stepsLeft) {

          // Take next step
          return nextStep(input, output, previous);
        }

        // Handle new input
        if (input.input !== previous.input
          && typeof previous.input === 'number') {

          // Start new ramp
          var newInput = {
            input: input.input,
            output: input.output,
            steps: input.steps,
            stepsLeft: input.steps,
          };

          // Take first step immediately
          return nextStep(newInput, output, previous);
        }

        // Handle new output
        if (input.output !== previous.output) {

          // Immediately transfer value to input
          output.input = input.output;
          output.stepsLeft = 0;

          // Do not request another tick
          return;
        }
      };

      var pins = ['input', 'output', 'steps', 'stepsLeft'];

      return {
        do: doFunc,
        pins: pins,
      };
    }(assertFiniteNumber, LiveBlocks.hasOwnProperty, host.Math)));

    // Make timer
    var timer = new LiveBlocks.ManualTimer();

    // Set timer on block
    block.timer(timer);

    // Make wires
    var input = new LiveBlocks.Wire({initialValue: 0});
    var output = new LiveBlocks.Wire({initialValue: 0});
    var steps = new LiveBlocks.Wire({initialValue: 1});
    var stepsLeft = new LiveBlocks.Wire({initialValue: 0});

    // Connect wires to block
    block.connect('input', input);
    block.connect('output', output);
    block.connect('steps', steps);
    block.connect('stepsLeft', stepsLeft);

    // Test stimulus
    steps.value(4);
    timer.tickTock();
    expect(input.value()).toBe(0);
    expect(output.value()).toBe(0);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Test stimulus
    input.value(4);
    timer.tickTock();
    expect(input.value()).toBe(4);
    expect(output.value()).toBe(1);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(3);

    // Test stimulus
    timer.tickTock();
    expect(input.value()).toBe(4);
    expect(output.value()).toBe(2);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(2);

    // Test stimulus
    timer.tickTock();
    expect(input.value()).toBe(4);
    expect(output.value()).toBe(3);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(1);

    // Test stimulus
    timer.tickTock();
    expect(input.value()).toBe(4);
    expect(output.value()).toBe(4);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Test stimulus
    timer.tickTock();
    expect(input.value()).toBe(4);
    expect(output.value()).toBe(4);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);
  });
});

