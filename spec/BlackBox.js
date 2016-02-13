"use strict";

describe("BlackBox class", function(){

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  var assertFiniteNumber, floatWire;
  beforeEach(function(){

    assertFiniteNumber = (function(isFinite, Error){

      return function(num){

        if (!(typeof num === "number" && isFinite(num)))
          throw new Error(num + " must be a number");
      };
    }(host.isFinite, host.Error));

    // Create a prototype floating point value wire
    floatWire = new LiveBlocks.Wire((function(Math, isFinite){

      var abs = Math.abs;
      var epsilon = 1e-14;

      var equalTo = function(value){

        if (
          typeof value === "number"
          && typeof this._value === "number"
          && isFinite(value)
          && isFinite(this._value)
        )
          return abs(this._value - value) < epsilon;
        else
          return value !== value ? this._value !== this._value : value === this._value;
      };

      return {equalTo: equalTo};
    }(host.Math, host.isFinite)));
  });

  it("integration test with multiple internal blocks", function(){

    // Create a prototype "plus one" block
    var plusOne = new LiveBlocks.WireConstraint((function(assertFiniteNumber){

      var aToB = function(){

        assertFiniteNumber(this.a);

        this.b = this.a + 1;
      };

      var bToA = function(){

        assertFiniteNumber(this.b);

        this.a = this.b - 1;
      };

      var functions = {
        a: aToB,
        b: bToA
      };

      return {
        functions: functions
      };
    }(assertFiniteNumber)));

    // Create a prototype "times two" block
    var timesTwo = new LiveBlocks.WireConstraint((function(assertFiniteNumber){

      var aToB = function(){

        assertFiniteNumber(this.a);

        this.b = this.a * 2;
      };

      var bToA = function(){

        assertFiniteNumber(this.b);

        this.a = this.b / 2;
      };

      var functions = {
        a: aToB,
        b: bToA
      };

      return {
        functions: functions
      };
    }(assertFiniteNumber)));

    // Create blocks and wires
    var blocks = {
      plusOne: plusOne.duplicate(),
      timesTwo: timesTwo.duplicate()
    };
    var wires = {
      low: floatWire.duplicate(),
      med: floatWire.duplicate(),
      high: floatWire.duplicate()
    };

    // Connect blocks and wires
    blocks.plusOne.connect("a", wires.low);
    blocks.plusOne.connect("b", wires.med);
    blocks.timesTwo.connect("a", wires.med);
    blocks.timesTwo.connect("b", wires.high);

    // Create BlackBox
    blocks.blackBox1 = new LiveBlocks.BlackBox({
      pins: {
        low: wires.low,
        med: wires.med,
        high: wires.high
      }
    });

    // Connect BlackBox to new wires
    wires.low1 = wires.low.duplicate();
    wires.med1 = wires.med.duplicate();
    wires.high1 = wires.high.duplicate();
    blocks.blackBox1.connect("low", wires.low1);
    blocks.blackBox1.connect("med", wires.med1);
    blocks.blackBox1.connect("high", wires.high1);

    // Duplicate BlackBox
    blocks.blackBox2 = blocks.blackBox1.duplicate();

    // Connect duplicate BlackBox to new wires
    wires.low2 = wires.low.duplicate();
    wires.med2 = wires.med.duplicate();
    wires.high2 = wires.high.duplicate();
    blocks.blackBox2.connect("low", wires.low2);
    blocks.blackBox2.connect("med", wires.med2);
    blocks.blackBox2.connect("high", wires.high2);

    // Test stimulus
    wires.med1.value(3);
    expect(wires.low.equalTo(2)).toBe(true);
    expect(wires.med.equalTo(3)).toBe(true);
    expect(wires.high.equalTo(6)).toBe(true);
    expect(wires.low1.equalTo(2)).toBe(true);
    expect(wires.med1.equalTo(3)).toBe(true);
    expect(wires.high1.equalTo(6)).toBe(true);
    expect(wires.low2.value()).toBeUndefined();
    expect(wires.med2.value()).toBeUndefined();
    expect(wires.high2.value()).toBeUndefined();

    // Test stimulus
    wires.med2.value(4);
    expect(wires.low.equalTo(2)).toBe(true);
    expect(wires.med.equalTo(3)).toBe(true);
    expect(wires.high.equalTo(6)).toBe(true);
    expect(wires.low1.equalTo(2)).toBe(true);
    expect(wires.med1.equalTo(3)).toBe(true);
    expect(wires.high1.equalTo(6)).toBe(true);
    expect(wires.low2.equalTo(3)).toBe(true);
    expect(wires.med2.equalTo(4)).toBe(true);
    expect(wires.high2.equalTo(8)).toBe(true);

    // Test stimulus
    wires.low2.value(4);
    expect(wires.low.equalTo(2)).toBe(true);
    expect(wires.med.equalTo(3)).toBe(true);
    expect(wires.high.equalTo(6)).toBe(true);
    expect(wires.low1.equalTo(2)).toBe(true);
    expect(wires.med1.equalTo(3)).toBe(true);
    expect(wires.high1.equalTo(6)).toBe(true);
    expect(wires.low2.equalTo(4)).toBe(true);
    expect(wires.med2.equalTo(5)).toBe(true);
    expect(wires.high2.equalTo(10)).toBe(true);

    // Test stimulus
    wires.med2.value("a");
    expect(wires.low2.equalTo(4)).toBe(true);
    expect(wires.med2.equalTo("a")).toBe(true);
    expect(wires.high2.equalTo(10)).toBe(true);
    expect(blocks.blackBox2.error()).not.toBeUndefined();

    // Test stimulus
    blocks.blackBox1.disconnect("low");
    expect(wires.low.value()).toBeUndefined();
    expect(wires.med.equalTo(3)).toBe(true);
    expect(wires.high.equalTo(6)).toBe(true);
    expect(wires.low1.equalTo(2)).toBe(true);
    expect(wires.med1.equalTo(3)).toBe(true);
    expect(wires.high1.equalTo(6)).toBe(true);
    expect(blocks.blackBox1.error()).not.toBeUndefined();
  });

  it("reports persistent internal errors", function(){

    // Create contrived black box to illustrate the problem
    var errorBlock
    var block = new LiveBlocks.BlackBox((function(Error){

      // Make blocks
      errorBlock = new LiveBlocks.WireConstraint((function(Error){

        var errFunc = function(){

          throw new Error("Just because");
        };

        var functions = {
          x: errFunc
        };

        return {functions: functions};
      }(Error)));
      var passStringBlock = new LiveBlocks.WireConstraint((function(){

        var aToB = function(){

          if (typeof this.a === "string")
            this.b = this.a;
        };

        var bToA = function(){

          if (typeof this.b === "string")
            this.a = this.b;
        }

        var functions = {
          a: aToB,
          b: bToA
        };

        return {functions: functions};
      }()));

      // Make wires
      var wireA = new LiveBlocks.Wire();
      var wireB = wireA.duplicate();

      // Connect blocks to wires
      passStringBlock.connect("a", wireA);
      passStringBlock.connect("b", wireB);
      errorBlock.connect("x", wireB);

      // Create pins hash
      var pins = {
        a: wireA
      };

      // Return
      return {pins: pins};
    }(host.Error)));

    // Make wires
    var wire = new LiveBlocks.Wire();

    // Connect blocks to wires
    block.connect("a", wire);

    // Check for internal and external errors
    expect(errorBlock.error()).not.toBeUndefined();
    expect(block.error()).not.toBeUndefined();

    // Set a string value
    // This forces errorBlock to fire a new "error" event
    wire.value("string");
    expect(errorBlock.error()).not.toBeUndefined();
    expect(block.error()).not.toBeUndefined();

    // Set a non-string value
    // errorBlock does not fire a new "error" event, but its error condition persists
    wire.value(1);
    expect(errorBlock.error()).not.toBeUndefined();
    expect(block.error()).not.toBeUndefined();
  });
});

