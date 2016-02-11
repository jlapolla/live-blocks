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

  it("integration test with Wire class where a wire has multiple connections (modified from WireConstraint spec)", function(){

    // Update log
    var log = [];

    // Make black box
    var block = new LiveBlocks.BlackBox((function(assertFiniteNumber){

      // Make blocks
      var plusOne = new LiveBlocks.WireConstraint((function(){

        // Make constraint functions
        var smaller2bigger = function(){

          assertFiniteNumber(this.smaller);

          this.bigger = this.smaller + 1;
          log.push("smaller2bigger");
        };
        var bigger2smaller = function(){

          assertFiniteNumber(this.bigger);

          this.smaller = this.bigger - 1;
          log.push("bigger2smaller");
        };

        // Return function hash
        return {functions: {bigger: bigger2smaller, smaller: smaller2bigger}};
      }()));
      var timesTwo = new LiveBlocks.WireConstraint((function(){

        // Make constraint functions
        var half2double = function(){

          assertFiniteNumber(this.half);

          this.double = this.half * 2;
          log.push("half2double");
        };
        var double2half = function(){

          assertFiniteNumber(this.double);

          this.half = this.double / 2;
          log.push("double2half");
        };

        // Return function hash
        return {functions: {half: half2double, double: double2half}};
      }()));

      // Make wires
      var wires = [];
      for (var i = 0; i < 3; i++)
        wires.push(new LiveBlocks.Wire());

      // Connect block pins to wires
      plusOne.connect("smaller", wires[0]);
      plusOne.connect("bigger", wires[1]);
      timesTwo.connect("half", wires[1]);
      timesTwo.connect("double", wires[2]);

      // Make pins hash
      var pins = {
        a: wires[0],
        b: wires[1],
        c: wires[2]
      };

      // Return
      return {pins: pins};
    }(assertFiniteNumber)));

    // Make wires
    var wires = [];
    for (var i = 0; i < 3; i++)
      wires.push(new LiveBlocks.Wire());

    // Connect block properties to wires
    block.connect("a", wires[0]);
    block.connect("b", wires[1]);
    block.connect("c", wires[2]);

    // Clear update log
    log.length = 0;

    // Set value on wires[0]
    wires[0].value(0);
    expect(wires[0].value()).toBe(0);
    expect(wires[1].value()).toBe(1);
    expect(wires[2].value()).toBe(2);
    expect(log).toEqual(["smaller2bigger", "half2double", "double2half", "bigger2smaller"]);

    // Clear update log
    log.length = 0;

    // Set another value on wires[0]
    wires[0].value(2);
    expect(wires[0].value()).toBe(2);
    expect(wires[1].value()).toBe(3);
    expect(wires[2].value()).toBe(6);
    expect(log).toEqual(["smaller2bigger", "half2double", "double2half", "bigger2smaller"]);

    // Clear update log
    log.length = 0;

    // Set value on wires[1]
    wires[1].value(0.5);
    expect(wires[0].value()).toBe(-0.5);
    expect(wires[1].value()).toBe(0.5);
    expect(wires[2].value()).toBe(1);
    expect(log).toEqual(["bigger2smaller", "smaller2bigger", "half2double", "double2half"]);

    // Clear update log
    log.length = 0;

    // Set value on wires[2]
    wires[2].value(8);
    expect(wires[0].value()).toBe(3);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(8);
    expect(log).toEqual(["double2half", "bigger2smaller", "smaller2bigger", "half2double"]);

    // Clear update log
    log.length = 0;

    // Disconnect pins
    block.disconnect("b");
    expect(log).toEqual([]);
    block.disconnect("c");
    expect(log).toEqual([]);

    // Clear update log
    log.length = 0;

    // Rewire blocks
    block.connect("b", wires[2]);
    block.connect("c", wires[1]);
    expect(wires[0].value()).toBe(1);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(2);
  });
});

