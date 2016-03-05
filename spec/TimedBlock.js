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

  it('timer() and unsetTimer() functions get and set block timer',
  function() {

    // Make a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function() {};

      var pins = [];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make some timers
    var timers = [];
    for (var i = 0; i < 2; i++) {

      timers.push(new LiveBlocks.ManualTimer());
    }

    // Block starts out without a timer
    expect(block.timer()).toBeUndefined();

    // Give the block timer 0
    block.timer(timers[0]);
    expect(block.timer()).toBe(timers[0]);

    // Give the block timer 0 again. Should have no effect
    block.timer(timers[0]);
    expect(block.timer()).toBe(timers[0]);

    // Give the block timer 1. Should replace timer 0 with timer 1
    block.timer(timers[1]);
    expect(block.timer()).toBe(timers[1]);

    // Unset timer
    block.unsetTimer();
    expect(block.timer()).toBeUndefined();

    // Call it again, just for robustness checking
    block.unsetTimer();
    expect(block.timer()).toBeUndefined();
  });

  it('fires "tick", "tock", and "error" events', function() {

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

    // Create logging event listeners
    var log = [];
    var listeners = {};
    (function(list) {

      for (var i = 0; i < list.length; i++) {

        listeners[list[i]] = (function(eventName) {

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

        block.on(list[i], listeners[list[i]]);
      }
    }(['tick', 'tock', 'error']));

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

    // Tick the timer. Should produce tick and tock events, since we've just
    // connected wires to the block
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].arg).toBeUndefined();
    expect(log[1].event).toBe('tock');
    expect(log[1].arg).toBeUndefined();

    // Clear log
    log.length = 0;

    // Tick the timer. Should NOT produce any events, since nothing has changed
    // since the last tick tock
    timer.tickTock();
    expect(log.length).toBe(0);

    // Set input to "a". This should cause an error. We will see 'tick' event,
    // followed by 'error' event
    input.value('a');
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].arg).toBeUndefined();
    expect(log[1].event).toBe('error');
    expect(log[1].arg).not.toBeUndefined();

    // Clear log
    log.length = 0;

    // Tick the timer. Should NOT produce any events, since nothing has changed
    // since the last tick tock
    timer.tickTock();
    expect(log.length).toBe(0);

    // Set input back to 0. This clears the error state. We should see 'tick'
    // followed by 'tock' events.
    input.value(0);
    timer.tickTock();
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('tick');
    expect(log[0].arg).toBeUndefined();
    expect(log[1].event).toBe('tock');
    expect(log[1].arg).toBeUndefined();
  });

  it('calls "do" function with same previous values, even '
  + 'if exact wire value differs', function() {

    // Make log for "do" function
    var log = [];

    // Make a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function(input, output, previous) {

        var logObj = {
          input: {},
          previous: {},
        };
        for (var name in input) {

          logObj.input[name] = input[name];
        }
        for (var name in previous) {

          logObj.previous[name] = previous[name];
        }
        log.push(logObj);

        output.a = input.a.toUpperCase();
      };

      var pins = ['a'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Give the timer to the block
    block.timer(timer);

    // Make a wire that ignores case in strings
    var wire = new LiveBlocks.Wire((function(){

      // Grab the default equalTo function
      var defaultEqualTo = new LiveBlocks.Wire().equalTo;

      var equalTo = function(value) {

        if (typeof value === 'string'
          && typeof this._value === 'string') {

          return value.toUpperCase() === this._value.toUpperCase();
        }
        else {

          return defaultEqualTo.call(this, value);
        }
      };

      return {
        equalTo: equalTo,
        initialValue: 'a',
      };
    }()));

    // Connect block to wire
    block.connect('a', wire);

    // Wire value is initially 'a' (remember, the block hasn't acted on it yet)
    expect(wire.value()).toBe('a');

    // When the timer ticks, the block will try to set the wire's value to
    // capital 'A', but the wire will not change it's value since it considers
    // 'a' and 'A' to be equal.
    timer.tickTock();
    expect(wire.value()).toBe('a');
    expect(log).toEqual([
      {
        input: {a: 'a'},
        previous: {},
      },
    ]);

    // Clear the log
    log.length = 0;

    // When timer ticks, nothing will happen.
    timer.tickTock();
    expect(wire.value()).toBe('a');
    expect(log).toEqual([]);

    // Change wire value to 'b'. The "do" function believes the last wire value
    // was 'A', since that's what it set last. But the wire value is really
    // 'a', since the wire is case insensitive. In this case, the "do" function
    // is called with a previous value of 'A' instead of the actual wire value
    // of 'a'. Basically, the TimedBlock let's the "do" function believe that
    // it's output value was actually set. This allows us to simplify the logic
    // in our "do" functions, since we can rely on the previous value being
    // whatever we set it to last, even if the wire didn't actually take the
    // previous value we set. It's up to the wire to decide if it needs to
    // accept the value, and the "do" function should have no knowledge of
    // this. All the "do" function needs to know is that the value it tried to
    // set last was sent to the wire for evaluation, and that the wire hasn't
    // been changed since we last sent it a value for evaluation.
    wire.value('b');
    timer.tickTock();
    expect(wire.value()).toBe('b');
    expect(log).toEqual([
      {
        input: {a: 'b'},
        previous: {a: 'A'},
      },
    ]);
  });

  it('calls "do" function when a wire is connected or disconnected, even '
  + 'if wire value is undefined', function() {

    // Make log for "do" function
    var log = [];

    // Make a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function(input, output, previous) {

        var logObj = {
          input: {},
          previous: {},
        };
        for (var name in input) {

          logObj.input[name] = input[name];
        }
        for (var name in previous) {

          logObj.previous[name] = previous[name];
        }
        log.push(logObj);
      };

      var pins = ['a', 'b'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Give the timer to the block
    block.timer(timer);

    // Make a wire
    var wire = new LiveBlocks.Wire();

    // Connect pin 'a'
    block.connect('a', wire);

    // When timer ticks, "do" function is called. Notice that previous.a ===
    // undefined and input.a === undefined, yet the "do" function is still
    // called because now input.a exists.
    timer.tickTock();
    timer.tickTock(); // Call it again just for robustness testing
    expect(wire.value()).toBeUndefined();
    expect(log).toEqual([
      {
        input: {a: undefined},
        previous: {},
      },
    ]);
    log.length = 0;

    // Connect pin 'b'
    block.connect('b', wire);

    // When timer ticks, "do" function is called. Again, the "do" function is
    // called because input.b exists now, where it previously did not exist,
    // even though input.b === previous.b === undefined.
    timer.tickTock();
    timer.tickTock(); // Call it again just for robustness testing
    expect(wire.value()).toBeUndefined();
    expect(log).toEqual([
      {
        input: {a: undefined, b: undefined},
        previous: {a: undefined},
      },
    ]);
    log.length = 0;

    // Disconnect pin 'a'
    block.disconnect('a');

    // Tick timer
    timer.tickTock();
    timer.tickTock(); // Call it again just for robustness testing
    expect(wire.value()).toBeUndefined();
    expect(log).toEqual([
      {
        input: {b: undefined},
        previous: {a: undefined, b: undefined},
      },
    ]);
    log.length = 0;

    // Disconnect pin 'b'
    block.disconnect('b');

    // Tick timer
    timer.tickTock();
    timer.tickTock(); // Call it again just for robustness testing
    expect(wire.value()).toBeUndefined();
    expect(log).toEqual([
      {
        input: {},
        previous: {b: undefined},
      },
    ]);
    log.length = 0;
  });

  it('does not persist values in previous when "do" '
  + 'function tries to write a non-existent wire', function() {

    // This is by design. The concern is that if we write an unconnected pin in
    // "do" and we persist that unconnected pin value in the previous argument
    // in the next call to "do", the "do" function will believe that the pin
    // previously existed, and it was disconnected. For blocks where a tick is
    // requested when this pin is disconnected, this would cause the "do"
    // function to request a tick every time, and thereby introduce a subtle
    // bug that impacts performance, and is very difficult to detect. This
    // suggest that we put the block in error state when "do" tries to write to
    // an unconnected pin, but this is not the optimal solution because
    // sometimes we design a block and we don't really care if the output goes
    // anywhere, and we never check it on "previous", and we don't want to have
    // to check if the pin is connecte on "input". We just want to say "if
    // there is a pin connected, set it's value to this". So, putting the block
    // in error state would be an inconvenience here. As a compromise, we
    // decide not to persist the non-existent pin value on "previous", so that
    // any sane "do" function would not believe that the pin has been
    // disconnected, and it would not introduce the subtle bug mentioned above.

    // Make log for "do" function
    var log = [];

    // Make a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function(input, output, previous) {

        var logObj = {
          input: {},
          previous: {},
        };
        for (var name in input) {

          logObj.input[name] = input[name];
        }
        for (var name in previous) {

          logObj.previous[name] = previous[name];
        }
        log.push(logObj);

        output.a = 'a';
        output.b = 'b';
        output.c = 'c';
      };

      var pins = ['a', 'b'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Give the timer to the block
    block.timer(timer);

    // Make wires
    var wire = {
      a: new LiveBlocks.Wire(),
      b: new LiveBlocks.Wire(),
      c: new LiveBlocks.Wire(),
    };

    // Connect pin 'a'
    block.connect('a', wire.a);

    // Timer tick
    timer.tickTock();
    timer.tickTock();
    expect(log).toEqual([
      {
        input: {a: undefined},
        previous: {},
      },
    ]);
    log.length = 0;

    // Connect pin 'b'
    block.connect('b', wire.b);

    // Timer tick. Notice that "previous" does not have 'b' or 'c', even though
    // we set 'b' and 'c' on output. This is because the 'b' and 'c' pins were
    // disconnected when we tried to set them.
    timer.tickTock();
    timer.tickTock();
    expect(log).toEqual([
      {
        input: {a: 'a', b: undefined},
        previous: {a: 'a'},
      },
    ]);
    log.length = 0;

    // Disconnect pin 'b'
    block.disconnect('b');

    // Timer tick
    timer.tickTock();
    timer.tickTock();
    expect(log).toEqual([
      {
        input: {a: 'a'},
        previous: {a: 'a', b: 'b'},
      },
    ]);
    log.length = 0;
  });

  it('does not call "do" function when wire value changes, '
  + 'and then changes back before a tick()', function() {

    // Make log for "do" function
    var log = [];

    // Make a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function(input, output, previous) {

        var logObj = {
          input: {},
          previous: {},
        };
        for (var name in input) {

          logObj.input[name] = input[name];
        }
        for (var name in previous) {

          logObj.previous[name] = previous[name];
        }
        log.push(logObj);

        output.a = 'a';
      };

      var pins = ['a'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Give the timer to the block
    block.timer(timer);

    // Make a wire
    var wire = new LiveBlocks.Wire();

    // Connect pin 'a'
    block.connect('a', wire);

    // Timer tick
    timer.tickTock();
    timer.tickTock();
    expect(wire.value()).toBe('a');
    expect(log).toEqual([
      {
        input: {a: undefined},
        previous: {},
      },
    ]);
    log.length = 0;

    // Change wire value, then change it back
    wire.value('b');
    wire.value('a');

    // Timer tick
    timer.tickTock();
    expect(wire.value()).toBe('a');
    expect(log).toEqual([]);
  });

  it('calls "do" function when tick is requested, '
  + 'even if wire values are the same', function() {

    // Make log for "do" function
    var log = [];

    // Make a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function(input, output, previous) {

        var logObj = {
          input: {},
          previous: {},
        };
        for (var name in input) {

          logObj.input[name] = input[name];
        }
        for (var name in previous) {

          logObj.previous[name] = previous[name];
        }
        log.push(logObj);

        output.a = 'a';

        // Explicitly request tick
        return true;
      };

      var pins = ['a'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Give the timer to the block
    block.timer(timer);

    // Make a wire
    var wire = new LiveBlocks.Wire();

    // Connect pin 'a'
    block.connect('a', wire);

    // Timer tick
    timer.tickTock();
    expect(wire.value()).toBe('a');
    expect(log).toEqual([
      {
        input: {a: undefined},
        previous: {},
      },
    ]);
    log.length = 0;

    // Timer tick calls "do" function even though no wire values changed since
    // last call
    timer.tickTock();
    timer.tickTock();
    expect(wire.value()).toBe('a');
    expect(log).toEqual([
      {
        input: {a: 'a'},
        previous: {a: 'a'},
      },
      {
        input: {a: 'a'},
        previous: {a: 'a'},
      },
    ]);
    log.length = 0;
  });

  it('calls "do" function with "this" set to undefined', function() {

    // Make log for "do" function
    var log = [];

    // Make a block
    var block = new LiveBlocks.TimedBlock((function(){

      var doFunc = function(input, output, previous) {

        log.push(this);

        output.a = 'a';
      };

      var pins = ['a'];

      return {
        do: doFunc,
        pins: pins,
      };
    }()));

    // Make a timer
    var timer = new LiveBlocks.ManualTimer();

    // Give the timer to the block
    block.timer(timer);

    // Make a wire
    var wire = new LiveBlocks.Wire();

    // Connect pin 'a'
    block.connect('a', wire);

    // Timer tick
    timer.tickTock();
    expect(wire.value()).toBe('a');
    expect(log.length).toBe(1);
    expect(log[0]).toBeUndefined();
  });
});

