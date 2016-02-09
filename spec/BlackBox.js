"use strict";

describe("BlackBox class", function(){

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  var blocks, wires;
  beforeEach(function(){

    // Create a prototype "plus one" block
    var plusOne = new LiveBlocks.WireConstraint((function(isFinite, Error){

      var assertFiniteNumber = function(num){

        if (!(typeof num === "number" && isFinite(num)))
          throw new Error(num + " must be a number");
      };

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
    }(host.isFinite, host.Error)));

    // Create a prototype "times two" block
    var timesTwo = new LiveBlocks.WireConstraint((function(isFinite, Error){

      var assertFiniteNumber = function(num){

        if (!(typeof num === "number" && isFinite(num)))
          throw new Error(num + " must be a number");
      };

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
    }(host.isFinite, host.Error)));

    // Create a prototype floating point value wire
    var floatWire = new LiveBlocks.Wire((function(Math, isFinite){

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
    }(host.Math, host.isFinite)));

    // Create blocks and wires
    blocks = {
      plusOne: plusOne.duplicate(),
      timesTwo: timesTwo.duplicate()
    };
    wires = {
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
  });

  it("integration test with multiple internal blocks", function(){

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
});

