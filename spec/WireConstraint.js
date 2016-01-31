"use strict";

describe("WireConstraint class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("demonstration", function(){

    // Update log
    var updateLog = [];

    // Make blocks
    var plusOne = new LiveBlocks.WireConstraint((function(){

      // Make constraint functions
      var smaller2bigger = function(){

        this.bigger = this.smaller + 1;
        updateLog.push("smaller2bigger");
      };
      var bigger2smaller = function(){

        this.smaller = this.bigger - 1;
        updateLog.push("bigger2smaller");
      };

      // Return function hash
      return {functions: {bigger: bigger2smaller, smaller: smaller2bigger}};
    }()));
    var timesTwo = new LiveBlocks.WireConstraint((function(){

      // Make constraint functions
      var half2double = function(){

        this.double = this.half * 2;
        updateLog.push("half2double");
      };
      var double2half = function(){

        this.half = this.double / 2;
        updateLog.push("double2half");
      };

      // Return function hash
      return {functions: {half: half2double, double: double2half}};
    }()));

    // Make wires
    var wires = [];
    for (var i = 0; i < 3; i++)
      wires.push(new LiveBlocks.Wire());

    // Connect block properties to wires
    plusOne.connect("smaller", wires[0]);
    plusOne.connect("bigger", wires[1]);
    timesTwo.connect("half", wires[1]);
    timesTwo.connect("double", wires[2]);

    // Clear update log
    updateLog.length = 0;

    // Set value on wires[0]
    wires[0].value(0);
    expect(wires[0].value()).toBe(0);
    expect(wires[1].value()).toBe(1);
    expect(wires[2].value()).toBe(2);
    expect(updateLog).toEqual(["smaller2bigger", "half2double", "double2half", "bigger2smaller"]);

    // Clear update log
    updateLog.length = 0;

    // Set another value on wires[0]
    wires[0].value(2);
    expect(wires[0].value()).toBe(2);
    expect(wires[1].value()).toBe(3);
    expect(wires[2].value()).toBe(6);
    expect(updateLog).toEqual(["smaller2bigger", "half2double", "double2half", "bigger2smaller"]);

    // Clear update log
    updateLog.length = 0;

    // Set value on wires[1]
    wires[1].value(0.5);
    expect(wires[0].value()).toBe(-0.5);
    expect(wires[1].value()).toBe(0.5);
    expect(wires[2].value()).toBe(1);
    expect(updateLog).toEqual(["bigger2smaller", "smaller2bigger", "half2double", "double2half"]);

    // Clear update log
    updateLog.length = 0;

    // Set value on wires[2]
    wires[2].value(8);
    expect(wires[0].value()).toBe(3);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(8);
    expect(updateLog).toEqual(["double2half", "bigger2smaller", "smaller2bigger", "half2double"]);

    // Clear update log
    updateLog.length = 0;

    // Re-wire blocks
    timesTwo.disconnect("half");
    timesTwo.disconnect("double");
    timesTwo.connect("half", wires[2]);
    timesTwo.connect("double", wires[1]);
    expect(wires[0].value()).toBe(3);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(2);
    expect(updateLog).toEqual(["half2double", "double2half", "half2double"]);
  });

  xit("catches exceptions in constraint functions");
});

