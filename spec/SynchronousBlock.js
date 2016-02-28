'use strict';

describe('SynchronousBlock class', function(){

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

  it('integration test with Clock class', function(){

    // Make ramp block
    var rampBlock = new LiveBlocks.SynchronousBlock((function(assertFiniteNumber){

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
    var integratorBlock = new LiveBlocks.SynchronousBlock((function(assertFiniteNumber){

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
});

