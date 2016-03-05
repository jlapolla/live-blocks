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
    var block = new LiveBlocks.TimedBlock((function(assertFiniteNumber) {

      var nextStep = function(input, output) {

        // Check if we are on the last step
        if (input.stepsLeft === 1) {

          // Move to final value
          output.output = input.input;
        }
        else {

          // Move output by another step
          output.output = input.output
            + (input.input - input.output) / input.stepsLeft;
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
    }(assertFiniteNumber)));

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
    for (var i = 0; i < 4; i++) {

      timer.tickTock();
      expect(input.value()).toBe(4);
      expect(output.value()).toBe(i + 1);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(3 - i);
    }

    // Test stimulus
    timer.tickTock();
    expect(input.value()).toBe(4);
    expect(output.value()).toBe(4);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Test stimulus
    input.value(-2);
    for (var i = 0; i < 4; i++) {

      timer.tickTock();
      expect(input.value()).toBe(-2);
      expect(output.value()).toBe(4 - (i + 1) * 6 / 4);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(4 - (i + 1));
    }

    // Test stimulus
    timer.tickTock();
    expect(input.value()).toBe(-2);
    expect(output.value()).toBe(-2);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Now we'll change input, but interrupt with a change to input
    input.value(2);
    for (var i = 0; i < 2; i++) {

      timer.tickTock();
      expect(input.value()).toBe(2);
      expect(output.value()).toBe(-2 + (i + 1) * 4 / 4);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(4 - (i + 1));
    }

    expect(input.value()).toBe(2);
    expect(output.value()).toBe(0);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(2);

    input.value(-2);
    for (var i = 0; i < 4; i++) {

      timer.tickTock();
      expect(input.value()).toBe(-2);
      expect(output.value()).toBe(0 - (i + 1) * 2 / 4);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(4 - (i + 1));
    }

    timer.tickTock();
    expect(input.value()).toBe(-2);
    expect(output.value()).toBe(-2);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Now we'll change input, but interrupt with a change to output
    input.value(2);
    for (var i = 0; i < 2; i++) {

      timer.tickTock();
      expect(input.value()).toBe(2);
      expect(output.value()).toBe(-2 + (i + 1) * 4 / 4);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(4 - (i + 1));
    }

    expect(input.value()).toBe(2);
    expect(output.value()).toBe(0);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(2);

    output.value(1);
    for (var i = 0; i < 4; i++) {

      timer.tickTock();
      expect(input.value()).toBe(1);
      expect(output.value()).toBe(1);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(0);
    }

    // And, just check another change to output
    output.value(2);
    for (var i = 0; i < 4; i++) {

      timer.tickTock();
      expect(input.value()).toBe(2);
      expect(output.value()).toBe(2);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(0);
    }
  });

  it('duplicates injected "do" function', function() {

    // Make a "do" function
    var doFunc = function() {};

    // Make a block
    var block = new LiveBlocks.TimedBlock({
      do: doFunc,
      pins: [],
    });
    expect(block._do).toBe(doFunc);

    // Duplicate the block
    var duplicate = block.duplicate();
    expect(duplicate._do).toBe(doFunc);
  });

  it('duplicates injected pins array', function() {

    // Make a "do" function
    var doFunc = function() {};

    // Make a block
    var block = new LiveBlocks.TimedBlock({
      do: doFunc,
      pins: ['a', 'b'],
    });
    var it = block.pins();
    expect(it.next().value).toEqual({pin: 'a', wire: undefined});
    expect(it.next().value).toEqual({pin: 'b', wire: undefined});
    expect(it.next().value).toBeUndefined();

    // Duplicate the block
    var duplicate = block.duplicate();
    it = duplicate.pins();
    expect(duplicate._pins).not.toBe(block._pins);
    expect(it.next().value).toEqual({pin: 'a', wire: undefined});
    expect(it.next().value).toEqual({pin: 'b', wire: undefined});
    expect(it.next().value).toBeUndefined();
  });

  it('catches errors in "do" function', function() {

    // Make a ramp block
    var block = new LiveBlocks.TimedBlock((function(assertFiniteNumber) {

      var nextStep = function(input, output) {

        // Check if we are on the last step
        if (input.stepsLeft === 1) {

          // Move to final value
          output.output = input.input;
        }
        else {

          // Move output by another step
          output.output = input.output
            + (input.input - input.output) / input.stepsLeft;
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
    }(assertFiniteNumber)));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Set timer on block
    block.timer(timer);

    // Make wires
    var input = new LiveBlocks.Wire({initialValue: 0});
    var output = new LiveBlocks.Wire({initialValue: 0});
    var steps = new LiveBlocks.Wire({initialValue: 4});
    var stepsLeft = new LiveBlocks.Wire({initialValue: 0});

    // Connect wires to block
    block.connect('input', input);
    block.connect('output', output);
    block.connect('steps', steps);
    block.connect('stepsLeft', stepsLeft);

    // Check initial state
    timer.tickTock();
    expect(block.error()).toBeUndefined();
    expect(input.value()).toBe(0);
    expect(output.value()).toBe(0);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Test stimulus
    input.value('a');
    expect(block.error()).toBeUndefined();
    timer.tickTock();
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toBe('a');
    expect(output.value()).toBe(0);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Test stimulus
    input.value(0);
    expect(block.error()).not.toBeUndefined();
    timer.tickTock();
    expect(block.error()).toBeUndefined();
    expect(input.value()).toBe(0);
    expect(output.value()).toBe(0);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Test stimulus
    input.value('a');
    expect(block.error()).toBeUndefined();
    timer.tickTock();
    expect(block.error()).not.toBeUndefined();
    expect(input.value()).toBe('a');
    expect(output.value()).toBe(0);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);

    // Test stimulus
    input.value(4);
    expect(block.error()).not.toBeUndefined();
    for (var i = 0; i < 4; i++) {

      timer.tickTock();
      expect(block.error()).toBeUndefined();
      expect(input.value()).toBe(4);
      expect(output.value()).toBe(i + 1);
      expect(steps.value()).toBe(4);
      expect(stepsLeft.value()).toBe(3 - i);
    }

    timer.tickTock();
    expect(input.value()).toBe(4);
    expect(output.value()).toBe(4);
    expect(steps.value()).toBe(4);
    expect(stepsLeft.value()).toBe(0);
  });

  it('fires events on pin connect and disconnect', function() {

    // Create a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function() {};

      var pins = ['a', 'b'];

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

        block.on(list[i], listeners[list[i]]);
      }
    }(['connect', 'disconnect']));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Set timer on block
    block.timer(timer);

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++) {

      wires.push(new LiveBlocks.Wire());
    }

    // Connect pin "a"
    block.connect('a', wires[0]);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('connect');
    expect(log[0].arg.pin).toBe('a');
    expect(log[0].arg.wire).toBe(wires[0]);

    // Clear log
    log.length = 0;

    // Connect pin "a" (redundant)
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

  it('throws error on connect to non-existent pin', function() {

    // Create a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function() {};

      var pins = [];

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

        block.on(list[i], listeners[list[i]]);
      }
    }(['connect', 'disconnect']));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Set timer on block
    block.timer(timer);

    // Create wires
    var wire = new LiveBlocks.Wire();

    // Connect to non-existent pin
    var badConnect = function() {

      block.connect('noexist', wire);
    };

    expect(badConnect).toThrowError('Pin "noexist" not found');
    expect(log.length).toBe(0);
  });

  it('pins() iterator iterates over pins', function() {

    // Create a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function() {};

      var pins = ['a', 'b'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Set timer on block
    block.timer(timer);

    // Create wires
    var wires = {
      a: new LiveBlocks.Wire(),
      b: new LiveBlocks.Wire(),
    };

    // First connection configuration
    block.connect('b', wires.b);
    var it = block.pins();
    expect(it.peek().value.pin).toBe('a');
    expect(it.next().value.wire).toBeUndefined();
    expect(it.peek().value.pin).toBe('b');
    expect(it.next().value.wire).toBe(wires.b);
    expect(it.peek().value).toBeUndefined();

    // Change connections (not reflected until we get a new iterator)
    block.connect('a', wires.a);

    // Reset iterator
    it.reset();
    expect(it.peek().value.pin).toBe('a');
    expect(it.next().value.wire).toBeUndefined();
    expect(it.peek().value.pin).toBe('b');
    expect(it.next().value.wire).toBe(wires.b);
    expect(it.peek().value).toBeUndefined();

    // Get new iterator
    it = block.pins();
    expect(it.peek().value.pin).toBe('a');
    expect(it.next().value.wire).toBe(wires.a);
    expect(it.peek().value.pin).toBe('b');
    expect(it.next().value.wire).toBe(wires.b);
    expect(it.peek().value).toBeUndefined();
  });

  xit('timer() and unsetTimer() functions get and set block timer',
  function() {});

  xit('fires "tick", "tock", and "error" events', function() {});

  xit('calls "do" function with same previous values, even '
  + 'if exact wire value differs', function() {});

  xit('calls "do" function when a wire is connected, even '
  + 'if wire value is undefined', function() {});

  xit('calls "do" function when a wire is disconnected, '
  + 'even if wire value was undefined', function() {});

  xit('calls "do" function after writing a non-existent wire in outputs',
  function() {});

  xit('does not call "do" function when wire value changes, '
  + 'and then changes back before a tick()', function() {});

  xit('calls "do" function when tick is requested, '
  + 'even if wire values are the same', function() {});

  xit('calls "do" function with "this" set to undefined', function() {});

  xit('tock() does not write wire value when '
  + 'the specified wire is not connected', function() {});
});

