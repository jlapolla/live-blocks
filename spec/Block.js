"use strict";

describe("Block class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("can chain and produce results synchronously", function(){

    // Create some inverter blocks
    var blocks = [];
    var run = function(){
      this.prop("output", !this.prop("input"));
    };
    for (var i = 0; i < 3; i++){
      var block = new LiveBlocks.Block();
      block.run = run;
      blocks.push(block);
    }

    // Connect inverter blocks
    blocks[1].prop("input", blocks[0], "output");
    blocks[2].prop("input", blocks[1], "output");

    // Test stimulus
    blocks[0].prop("input", true);
    expect(blocks[0].prop("input")).toEqual(true);
    expect(blocks[0].prop("output")).toEqual(false);
    expect(blocks[1].prop("input")).toEqual(false);
    expect(blocks[1].prop("output")).toEqual(true);
    expect(blocks[2].prop("input")).toEqual(true);
    expect(blocks[2].prop("output")).toEqual(false);

    // Switch test stimulus
    blocks[0].prop("input", false);
    expect(blocks[0].prop("input")).toEqual(false);
    expect(blocks[0].prop("output")).toEqual(true);
    expect(blocks[1].prop("input")).toEqual(true);
    expect(blocks[1].prop("output")).toEqual(false);
    expect(blocks[2].prop("input")).toEqual(false);
    expect(blocks[2].prop("output")).toEqual(true);
  });

  it("updates linked objects efficiently", function(){

    // Create some inverter blocks which log their calls
    var runLog = [];
    var blocks = [];
    var run = function(){
      runLog.push(this);
      this.prop("output", !this.prop("input"));
    };
    for (var i = 0; i < 3; i++){
      var block = new LiveBlocks.Block();
      block.run = run;
      blocks.push(block);
    }

    // Connect inverter blocks
    blocks[1].prop("input", blocks[0], "output");
    blocks[2].prop("input", blocks[1], "output");

    // Test stimulus
    blocks[0].prop("input", true);
    expect(runLog.length).toBe(6);
    expect(runLog[0]).toBe(blocks[0]);
    expect(runLog[1]).toBe(blocks[0]);
    expect(runLog[2]).toBe(blocks[1]);
    expect(runLog[3]).toBe(blocks[1]);
    expect(runLog[4]).toBe(blocks[2]);
    expect(runLog[5]).toBe(blocks[2]);

    // Clear runLog
    runLog.length = 0;

    // Switch test stimulus
    blocks[0].prop("input", false);
    expect(runLog.length).toBe(6);
    expect(runLog[0]).toBe(blocks[0]);
    expect(runLog[1]).toBe(blocks[0]);
    expect(runLog[2]).toBe(blocks[1]);
    expect(runLog[3]).toBe(blocks[1]);
    expect(runLog[4]).toBe(blocks[2]);
    expect(runLog[5]).toBe(blocks[2]);
  });

  it("handles block feedback efficiently", function(){

    // Create some inverter blocks which log their calls
    var runLog = [];
    var blocks = [];
    var run = function(){
      runLog.push(this);
      this.prop("A", this.prop("a"));
      this.prop("B", this.prop("b"));
    };
    for (var i = 0; i < 3; i++){
      var block = new LiveBlocks.Block();
      block.run = run;
      blocks.push(block);
    }

    // Connect blocks
    blocks[1].prop("a", blocks[0], "A");
    blocks[0].prop("b", blocks[1], "A");
    blocks[1].prop("b", blocks[0], "B");

    // Test stimulus
    blocks[0].prop("a", true);
    expect(runLog.length).toBe(8);
    expect(runLog[0]).toBe(blocks[0]);
    expect(runLog[1]).toBe(blocks[0]);
    expect(runLog[2]).toBe(blocks[1]);
    expect(runLog[3]).toBe(blocks[1]);
    expect(runLog[4]).toBe(blocks[0]);
    expect(runLog[5]).toBe(blocks[0]);
    expect(runLog[6]).toBe(blocks[1]);
    expect(runLog[7]).toBe(blocks[1]);
  });

  it("automatically overwrites sourced outputs with a value", function(){

    // Create a static output block
    var block = new LiveBlocks.Block();
    block.run = function(){
      this.prop("output", true);
    };

    // Try overwriting the output
    block.prop("output", false);
    expect(block.prop("output")).toBe(true);

    // Try overwriting the output
    block.prop("output", 3);
    expect(block.prop("output")).toBe(true);
  });

  it("detaches from old sources", function(){

    // Create some inverter blocks which log their calls
    var runLog = [];
    var blocks = [];
    var run = function(){
      runLog.push(this);
      this.prop("output", !this.prop("input"));
    };
    for (var i = 0; i < 3; i++){
      var block = new LiveBlocks.Block();
      block.run = run;
      blocks.push(block);
    }

    // Connect blocks in first configuration
    blocks[2].prop("input", blocks[0], "output");

    // Test stimulus
    blocks[0].prop("input", true);
    expect(runLog.length).toBe(4);
    expect(runLog[0]).toBe(blocks[0]);
    expect(runLog[1]).toBe(blocks[0]);
    expect(runLog[2]).toBe(blocks[2]);
    expect(runLog[3]).toBe(blocks[2]);

    // Connect blocks in second configuration
    blocks[2].prop("input", blocks[1], "output");

    // Reset runLog
    runLog.length = 0;

    // Test stimulus
    blocks[0].prop("input", false);
    expect(runLog.length).toBe(2);
    expect(runLog[0]).toBe(blocks[0]);
    expect(runLog[1]).toBe(blocks[0]);
  });

  it("can delete properties", function(){});

  it("does not hang when .run() is undefined", function(){});
});
