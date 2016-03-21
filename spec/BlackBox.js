'use strict';

describe('BlackBox class', function() {

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  // Skip test if BlackBox is not exposed
  if (!LiveBlocks.BlackBox) {

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

  it('integration test with multiple internal blocks', function() {

    // Create a prototype "plus one" block
    var plusOneFactory = ((function(assertFiniteNumber) {

      var aToB = function(input, output) {

        assertFiniteNumber(input.a);

        output.b = input.a + 1;
      };

      var bToA = function(input, output) {

        assertFiniteNumber(input.b);

        output.a = input.b - 1;
      };

      return function() {

        var pins = {
          a: aToB,
          b: bToA,
        };

        return new LiveBlocks.ImmediateBlock({pins: pins});
      };
    }(assertFiniteNumber)));

    // Create a prototype "times two" block
    var timesTwoFactory = ((function(assertFiniteNumber) {

      var aToB = function(input, output) {

        assertFiniteNumber(input.a);

        output.b = input.a * 2;
      };

      var bToA = function(input, output) {

        assertFiniteNumber(input.b);

        output.a = input.b / 2;
      };

      return function() {

        var pins = {
          a: aToB,
          b: bToA,
        };

        return new LiveBlocks.ImmediateBlock({pins: pins});
      };
    }(assertFiniteNumber)));

    // Create blocks and wires
    var blocks = {
      plusOne: plusOneFactory(),
      timesTwo: timesTwoFactory(),
    };
    var wires = {
      low: floatWireFactory(),
      med: floatWireFactory(),
      high: floatWireFactory(),
    };

    // Connect blocks and wires
    blocks.plusOne.connect('a', wires.low);
    blocks.plusOne.connect('b', wires.med);
    blocks.timesTwo.connect('a', wires.med);
    blocks.timesTwo.connect('b', wires.high);

    // Create BlackBox
    blocks.blackBox1 = new LiveBlocks.BlackBox({
      pins: {
        low: wires.low,
        med: wires.med,
        high: wires.high,
      },
    });

    // Connect BlackBox to new wires
    wires.low1 = floatWireFactory();
    wires.med1 = floatWireFactory();
    wires.high1 = floatWireFactory();
    blocks.blackBox1.connect('low', wires.low1);
    blocks.blackBox1.connect('med', wires.med1);
    blocks.blackBox1.connect('high', wires.high1);

    // Test stimulus
    wires.med1.value(3);
    expect(wires.low.equalTo(2)).toBe(true);
    expect(wires.med.equalTo(3)).toBe(true);
    expect(wires.high.equalTo(6)).toBe(true);
    expect(wires.low1.equalTo(2)).toBe(true);
    expect(wires.med1.equalTo(3)).toBe(true);
    expect(wires.high1.equalTo(6)).toBe(true);

    // Test stimulus
    blocks.blackBox1.disconnect('low');
    expect(wires.low.value()).toBeUndefined();
    expect(wires.med.equalTo(3)).toBe(true);
    expect(wires.high.equalTo(6)).toBe(true);
    expect(wires.low1.equalTo(2)).toBe(true);
    expect(wires.med1.equalTo(3)).toBe(true);
    expect(wires.high1.equalTo(6)).toBe(true);
    expect(blocks.blackBox1.error()).not.toBeUndefined();
  });

  it('integration test with nested BlackBox', function() {

    // Make BlackBox prototype with nested BlackBox's
    var protoFactory = ((function() {

      // Make internal BlackBox prototype
      var protoFactory = ((function() {

        // ImmediateBlock constraint functions
        var aToB = function(input, output) {

          output.b = input.a;
        };

        var bToA = function(input, output) {

          output.a = input.b;
        };

        return function() {

          // Pass-through wire constraint
          var block = new LiveBlocks.ImmediateBlock({
            pins: {
              a: aToB,
              b: bToA,
            },
          });

          // Wires
          var wires = [];
          for (var i = 0; i < 2; i++) {

            wires.push(new LiveBlocks.Wire());
          }

          // Connect block to wires
          block.connect('a', wires[0]);
          block.connect('b', wires[1]);

          // Create BlackBox pins hash
          var pins = {
            a: wires[0],
            b: wires[1],
          };

          // Return BlackBox
          return new LiveBlocks.BlackBox({pins: pins});
        };
      }()));

      return function() {

        // Make internal BlackBox's
        var blocks = [];
        for (var i = 0; i < 2; i++) {

          blocks.push(protoFactory());
        }

        // Make wires
        var wires = [];
        for (var i = 0; i < 3; i++) {

          wires.push(new LiveBlocks.Wire());
        }

        // Connect internal BlackBox's to wires
        blocks[0].connect('a', wires[0]);
        blocks[0].connect('b', wires[1]);
        blocks[1].connect('a', wires[1]);
        blocks[1].connect('b', wires[2]);

        // Make pins hash
        var pins = {
          a: wires[0],
          b: wires[1],
          c: wires[2],
        };

        // Return BlackBox
        return new LiveBlocks.BlackBox({pins: pins});
      };
    }()));

    // Duplicate prototype
    var proto = protoFactory();
    var block = protoFactory();

    // Make wires
    var wires = [];
    for (var i = 0; i < 3; i++) {

      wires.push(new LiveBlocks.Wire());
    }

    // Connect block to wires
    block.connect('a', wires[0]);
    block.connect('b', wires[1]);
    block.connect('c', wires[2]);

    // Make values
    var values = {
      a: {},
      b: {},
      c: {},
    };

    // Test stimulus
    wires[0].value(values.a);
    for (var i = 0; i < wires.length; i++) {

      expect(wires[i].value()).toBe(values.a);
    }

    // Test stimulus
    wires[1].value(values.b);
    for (var i = 0; i < wires.length; i++) {

      expect(wires[i].value()).toBe(values.b);
    }

    // Test stimulus
    wires[2].value(values.c);
    for (var i = 0; i < wires.length; i++) {

      expect(wires[i].value()).toBe(values.c);
    }

    // Disconnect block and connect prototype
    block.disconnect('a');
    block.disconnect('b');
    block.disconnect('c');

    // Connect prototype to wires
    proto.connect('a', wires[0]);
    proto.connect('b', wires[1]);
    proto.connect('c', wires[2]);

    // Test stimulus
    wires[0].value(values.a);
    for (var i = 0; i < wires.length; i++) {

      expect(wires[i].value()).toBe(values.a);
    }

    // Test stimulus
    wires[1].value(values.b);
    for (var i = 0; i < wires.length; i++) {

      expect(wires[i].value()).toBe(values.b);
    }

    // Test stimulus
    wires[2].value(values.c);
    for (var i = 0; i < wires.length; i++) {

      expect(wires[i].value()).toBe(values.c);
    }
  });

  it('integration test with Wire class where a wire has multiple connections '
  + '(adapted from ImmediateBlock spec)', function() {

    // Update log
    var log = [];

    // Make black box
    var block = new LiveBlocks.BlackBox((function() {

      // Make blocks
      var plusOne = new LiveBlocks.ImmediateBlock((function() {

        // Make constraint functions
        var smaller2bigger = function(input, output) {

          output.bigger = input.smaller + 1;
          log.push('smaller2bigger');
        };

        var bigger2smaller = function(input, output) {

          output.smaller = input.bigger - 1;
          log.push('bigger2smaller');
        };

        // Return function hash
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

        // Return function hash
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

      // Make pins hash
      var pins = {
        a: wires[0],
        b: wires[1],
        c: wires[2],
      };

      // Return
      return {pins: pins};
    }()));

    // Make wires
    var wires = [];
    for (var i = 0; i < 3; i++) {

      wires.push(new LiveBlocks.Wire());
    }

    // Connect block properties to wires
    block.connect('a', wires[0]);
    block.connect('b', wires[1]);
    block.connect('c', wires[2]);

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
    expect(log).toEqual([
      'bigger2smaller',
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
    block.disconnect('b');
    block.disconnect('c');

    // Clear update log
    log.length = 0;

    // Rewire blocks
    block.connect('b', wires[2]);
    block.connect('c', wires[1]);
    expect(wires[0].value()).toBe(1);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(2);
    expect(log).toEqual([
      'double2half',
      'bigger2smaller',
      'smaller2bigger',
      'half2double']);
  });

  it('integration test with Wire class where the ImmediateBlock has multiple '
  + 'inputs and outputs (adapted from ImmediateBlock)', function() {

    // Convert rectangular to polar coordinates
    var block = new LiveBlocks.BlackBox((function() {

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

      // Connect wires to block pins
      block.connect('x', wires.x);
      block.connect('y', wires.y);
      block.connect('r', wires.r);
      block.connect('theta', wires.theta);

      // Make pins hash
      var pins = {
        x: wires.x,
        y: wires.y,
        r: wires.r,
        theta: wires.theta,
      };

      // Return
      return {pins: pins};
    }()));

    // Make wires
    var wires = {};
    (function(wireNames) {

      for (var i = 0; i < wireNames.length; i++) {

        wires[wireNames[i]] = floatWireFactory();
      }
    }(['x', 'y', 'r', 'theta']));

    // Connect wires to block pins
    block.connect('x', wires.x);
    block.connect('y', wires.y);
    block.connect('r', wires.r);
    block.connect('theta', wires.theta);

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

  it('integration test with read-only values (adapted '
  + ' from ImmediateBlock spec)', function() {

    // We will make a flip flop from two cross-coupled NOR gates
    var block = new LiveBlocks.BlackBox((function() {

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

      // Make pins hash
      var pins = {
        R: R,
        S: S,
        Q: Q,
        notQ: notQ,
      };

      // Return
      return {pins: pins};
    }()));

    // Make some wires
    var R = new LiveBlocks.Wire();
    var S = new LiveBlocks.Wire();
    var Q = new LiveBlocks.Wire();
    var notQ = new LiveBlocks.Wire();

    // Connect blocks to wires
    block.connect('R', R);
    block.connect('S', S);
    block.connect('Q', Q);
    block.connect('notQ', notQ);

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

  it('reacts to internal updates (e.g., from ClockedBlock\'s)', function() {

    // Make immediate adder block
    var adderBlock = (function(assertFiniteNumber) {

      var addFunc = function(input, output) {

        assertFiniteNumber(input.a);
        assertFiniteNumber(input.b);

        output.sum = input.a + input.b;
      };

      var pins = {
        a: addFunc,
        b: addFunc,
        sum: addFunc,
      };

      return new LiveBlocks.ImmediateBlock({pins: pins});
    }(assertFiniteNumber));

    // Make internal wires
    var innerWires = {
      a: new LiveBlocks.Wire(),
      b: new LiveBlocks.Wire(),
      sum: new LiveBlocks.Wire(),
    };

    // Make circuit and black box
    var blackBox = (function() {

      adderBlock.connect('a', innerWires.a);
      adderBlock.connect('b', innerWires.b);
      adderBlock.connect('sum', innerWires.sum);

      var pins = {
        a: innerWires.a,
        b: innerWires.b,
        sum: innerWires.sum,
      };

      return new LiveBlocks.BlackBox({pins: pins});
    }());

    // Make wires
    var wires = {
      a: new LiveBlocks.Wire(),
      b: new LiveBlocks.Wire(),
      sum: new LiveBlocks.Wire(),
    };

    // Connect wires
    blackBox.connect('a', wires.a);
    blackBox.connect('b', wires.b);
    blackBox.connect('sum', wires.sum);

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

        // Register listener on black box
        blackBox.on(list[i], listener);
      }
    }(['update', 'success', 'error']));

    // Set initial wire values
    wires.a.value(0);
    wires.b.value(0);
    log.length = 0;

    // Check initial conditions
    expect(log.length).toBe(0);
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(0);
    expect(wires.sum.value()).toBe(0);

    // Trigger update internally
    innerWires.b.value(1)
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[3].event).toBe('success');
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(1);
    expect(wires.sum.value()).toBe(1);
    log.length = 0;

    // Trigger update externally
    wires.b.value(2);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[3].event).toBe('success');
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(2);
    expect(wires.sum.value()).toBe(2);
    log.length = 0;

    // Produce error internally
    innerWires.b.value('b');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('error');
    expect(blackBox.error()).not.toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(2);
    expect(wires.sum.value()).toBe(2);
    log.length = 0;

    // Clear error internally
    innerWires.b.value(3);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[3].event).toBe('success');
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(3);
    expect(wires.sum.value()).toBe(3);
    log.length = 0;

    // Produce error internally
    innerWires.b.value('b');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('error');
    expect(blackBox.error()).not.toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(3);
    expect(wires.sum.value()).toBe(3);
    log.length = 0;

    // Clear error externally
    wires.b.value(4);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[3].event).toBe('success');
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(4);
    expect(wires.sum.value()).toBe(4);
    log.length = 0;

    // Produce error externally
    wires.b.value('b');
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('error');
    expect(blackBox.error()).not.toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe('b');
    expect(wires.sum.value()).toBe(4);
    log.length = 0;

    // Clear error internally
    innerWires.b.value(5);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[3].event).toBe('success');
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(5);
    expect(wires.sum.value()).toBe(5);
    log.length = 0;

    // Produce error externally
    wires.b.value('b');
    expect(log.length).toBe(2);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('error');
    expect(blackBox.error()).not.toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe('b');
    expect(wires.sum.value()).toBe(5);
    log.length = 0;

    // Clear error externally
    wires.b.value(6);
    expect(log.length).toBe(4);
    expect(log[0].event).toBe('update');
    expect(log[1].event).toBe('success');
    expect(log[2].event).toBe('update');
    expect(log[3].event).toBe('success');
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(6);
    expect(wires.sum.value()).toBe(6);
    log.length = 0;
  });

  it('handles unconnected pins elegantly', function() {

    // Make immediate adder block
    var adderBlock = (function(assertFiniteNumber) {

      var addFunc = function(input, output) {

        assertFiniteNumber(input.a);
        assertFiniteNumber(input.b);

        output.sum = input.a + input.b;
      };

      var pins = {
        a: addFunc,
        b: addFunc,
        sum: addFunc,
      };

      return new LiveBlocks.ImmediateBlock({pins: pins});
    }(assertFiniteNumber));

    // Make internal wires
    var innerWires = {
      a: new LiveBlocks.Wire(),
      b: new LiveBlocks.Wire(),
      sum: new LiveBlocks.Wire(),
    };

    // Make circuit and black box
    var blackBox = (function() {

      adderBlock.connect('a', innerWires.a);
      adderBlock.connect('b', innerWires.b);
      adderBlock.connect('sum', innerWires.sum);

      var pins = {
        a: innerWires.a,
        b: innerWires.b,
        sum: innerWires.sum,
      };

      return new LiveBlocks.BlackBox({pins: pins});
    }());

    // Make wires
    var wires = {
      a: new LiveBlocks.Wire(),
      b: new LiveBlocks.Wire(),
      sum: new LiveBlocks.Wire(),
    };

    // Connect wires, except the "sum" pin
    blackBox.connect('a', wires.a);
    blackBox.connect('b', wires.b);

    // Set initial wire values
    wires.a.value(0);
    wires.b.value(0);

    // Check initial conditions
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(0);
    expect(wires.b.value()).toBe(0);
    expect(wires.sum.value()).toBeUndefined();

    // Make an internal change
    innerWires.a.value(1);
    expect(blackBox.error()).toBeUndefined();
    expect(wires.a.value()).toBe(1);
    expect(wires.b.value()).toBe(0);
    expect(wires.sum.value()).toBeUndefined();
  });

  it('disconnects pin from wire before connecting to a new wire', function() {

    // Create a black box
    var block = new LiveBlocks.BlackBox({pins: {x: new LiveBlocks.Wire()}});

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
    var block = new LiveBlocks.BlackBox((function() {

      var wire = new LiveBlocks.Wire();

      var pins = {
        a: wire,
        b: wire,
      };

      return {pins: pins};
    }()));

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
    var block = new LiveBlocks.BlackBox({});

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Connect to non-existent pin
    expect(function() {

      block.connect('x', wire);
    }).toThrowError('Pin "x" not found');
  });

  it('catches exceptions in pin functions', function() {

    // Create a block that throws error

    var block = new LiveBlocks.BlackBox((function() {

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

      // Create pins hash
      var pins = {
        a: wireA,
        b: wireB,
      };

      // Return
      return {pins: pins};
    }()));

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

    // Create a black box
    var block = new LiveBlocks.BlackBox((function(TypeError) {

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

      // Connect blocks and wires
      block.connect('a', wireA);
      block.connect('b', wireB);

      // Create pins hash
      var pins = {
        a: wireA,
        b: wireB,
      };

      // Return
      return {pins: pins};
    }(host.TypeError)));

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
    expect(log[1].arg.message).toBe('Pin "b" must be a number');
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

    // Create a black box
    var block = new LiveBlocks.BlackBox((function() {

      // Create a block
      var noop = function() {};

      var block = new LiveBlocks.ImmediateBlock({
        pins: {a: noop, b: noop}
      });

      // Create wires
      var wires = [];
      for (var i = 0; i < 2; i++) {

        wires.push(new LiveBlocks.Wire());
      }

      // Connect block to wires
      block.connect('a', wires[0]);
      block.connect('b', wires[1]);

      // Create pins hash
      var pins = {
        a: wires[0],
        b: wires[1],
      };

      // Return
      return {pins: pins};
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

    // Reconnect pin "a" to same wire (does nothing)
    block.connect('a', wires[1]);
    expect(log.length).toBe(0);

    // Clear log
    log.length = 0;

    // Disconnect pin "b"
    block.disconnect('b');
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('disconnect');
    expect(log[0].arg.pin).toBe('b');
    expect(log[0].arg.wire).toBe(wires[1]);
  });

  it('reports persistent internal errors', function() {

    // Create contrived black box to illustrate the problem
    var errorBlock;
    var block = new LiveBlocks.BlackBox((function(Error) {

      // Make blocks
      errorBlock = new LiveBlocks.ImmediateBlock((function(Error) {

        var errFunc = function() {

          throw new Error('Just because');
        };

        var pins = {
          x: errFunc,
        };

        return {pins: pins};
      }(Error)));

      var passStringBlock = new LiveBlocks.ImmediateBlock((function() {

        var aToB = function(input, output) {

          if (typeof input.a === 'string') {

            output.b = input.a;
          }
        };

        var bToA = function(input, output) {

          if (typeof input.b === 'string') {

            output.a = input.b;
          }
        };

        var pins = {
          a: aToB,
          b: bToA,
        };

        return {pins: pins};
      }()));

      // Make wires
      var wireA = new LiveBlocks.Wire();
      var wireB = new LiveBlocks.Wire();

      // Connect blocks to wires
      passStringBlock.connect('a', wireA);
      passStringBlock.connect('b', wireB);
      errorBlock.connect('x', wireB);

      // Create pins hash
      var pins = {
        a: wireA,
      };

      // Return
      return {pins: pins};
    }(host.Error)));

    // Make wires
    var wire = new LiveBlocks.Wire();

    // Connect blocks to wires
    block.connect('a', wire);

    // Check for internal and external errors
    expect(errorBlock.error()).not.toBeUndefined();
    expect(block.error()).not.toBeUndefined();

    // Set a string value
    // This forces errorBlock to fire a new "error" event
    wire.value('string');
    expect(errorBlock.error()).not.toBeUndefined();
    expect(block.error()).not.toBeUndefined();

    // Set a non-string value
    // errorBlock does not fire a new "error" event, but its error condition persists
    wire.value(1);
    expect(errorBlock.error()).not.toBeUndefined();
    expect(block.error()).not.toBeUndefined();
  });

  it('pins() iterator iterates over pins', function() {

    // Create a black box
    var block = new LiveBlocks.BlackBox((function() {

      // Create pins hash
      var pins = {
        a: new LiveBlocks.Wire(),
        b: new LiveBlocks.Wire(),
        c: new LiveBlocks.Wire(),
      };

      // Return
      return {pins: pins};
    }()));

    // Create wires
    var wires = {
      a: new LiveBlocks.Wire(),
      b: new LiveBlocks.Wire(),
      c: new LiveBlocks.Wire(),
    };

    // Connect block to wires
    block.connect('a', wires.a);
    block.connect('b', wires.b);

    // Get pins iterator
    var it = block.pins();

    // Connect last wire (should not show up in the iterator)
    block.connect('c', wires.c);

    // Run through iterator
    var pin = it.peek().value;
    expect(pin.pin).toBe('a');
    expect(pin.wire).toBe(wires.a);
    pin = it.next().value;
    expect(pin.pin).toBe('a');
    expect(pin.wire).toBe(wires.a);

    pin = it.peek().value;
    expect(pin.pin).toBe('b');
    expect(pin.wire).toBe(wires.b);
    pin = it.next().value;
    expect(pin.pin).toBe('b');
    expect(pin.wire).toBe(wires.b);

    pin = it.peek().value;
    expect(pin.pin).toBe('c');
    expect(pin.wire).toBeUndefined();
    pin = it.next().value;
    expect(pin.pin).toBe('c');
    expect(pin.wire).toBeUndefined();

    expect(it.peek().done).toBe(true);
    expect(it.next().done).toBe(true);
  });

  it('detects infinite loops', function() {

    // Create a BlackBox with one-way pass-through
    var block = (function() {

      var func = function(input, output) {

        output.output = input.input;
      };

      var block = new LiveBlocks.ImmediateBlock({
        pins: {
          input: func,
          output: func,
        },
      });

      var input = new LiveBlocks.Wire();
      var output = new LiveBlocks.Wire();

      block.connect('input', input);
      block.connect('output', output);

      return new LiveBlocks.BlackBox({
        pins: {
          input: input,
          output: output,
        }
      });
    }());

    var alwaysFalse = (function() {

      var func = function(input, output) {

        output.output = false;
      };

      return new LiveBlocks.ImmediateBlock({
        pins: {
          output: func,
        },
      });
    }());

    // Create wires
    var input = new LiveBlocks.Wire();
    var output = new LiveBlocks.Wire();

    // Connect wires to pins
    block.connect('input', input);
    block.connect('output', output);

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
    expect(LiveBlocks.BlackBox.maxIterations()).toBe(100);

    // Set low max iterations, so the test runs quickly
    LiveBlocks.BlackBox.maxIterations(10);
    expect(LiveBlocks.BlackBox.maxIterations()).toBe(10);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 10 iterations');

    // Set new maxIterations
    LiveBlocks.BlackBox.maxIterations(20);
    expect(LiveBlocks.BlackBox.maxIterations()).toBe(20);
    expect(triggerLoop)
        .toThrowError('Infinite loop detected: reached 20 iterations');
  });
});

