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

  it("automatically re-makes deleted outputs", function(){

    // Create a static output block
    var block = new LiveBlocks.Block();
    block.run = function(){
      this.prop("output", true);
    };
    block.run();

    // Try deleting the output
    block.del("output");
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

  it("can delete properties", function(){

    // Create an inverter block
    var runLog = [];
    var block = new LiveBlocks.Block();
    block.run = function(){
      runLog.push(this);
      this.prop("output", !this.prop("input"));
    };

    // Set "input" property
    block.prop("input", true);
    expect(runLog.length).toBe(2);
    expect(block.prop("output")).toBe(false);

    // Clear runLog
    runLog.length = 0;

    // Delete "input" property
    block.del("input");
    expect(runLog.length).toBe(2);
    expect(block.prop("output")).toBe(true);
    expect(block._properties).toEqual({"output": {cached: true, value: true}});
  });

  it("does nothing when .del() is called on a non-existent property", function(){

    // Create a block
    var block = new LiveBlocks.Block();
    var input = {};

    // Set "input" property
    block.prop("input", input);
    expect(block.prop("input")).toBe(input);

    // Delete non-existent property
    block.del("noexist");
    expect(block.prop("input")).toBe(input);
  });

  it("works when .run() is undefined", function(){

    // Create a block
    var block = new LiveBlocks.Block();
    var input = {};

    // Set "input" property
    block.prop("input", input);
    expect(block.prop("input")).toBe(input);
  });

  it("returns \"undefined\" for non-existent properties", function(){

    // Create a block with no properties
    var block = new LiveBlocks.Block();
    expect(block.prop("noexist")).toBeUndefined();
  });

  it("handles \"NaN\" values", function(){

    // Create a division block
    var block = new LiveBlocks.Block(function(){

      this.prop("quotient", this.prop("numerator") / this.prop("denominator"));
    });

    // Produce "NaN" value
    block.prop("numerator", 12);
    expect(block.prop("quotient")).not.toBe(block.prop("quotient")); // "quotient" is "NaN"
    // This is a valid test for "NaN"
    // See this link:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN#Confusing_special-case_behavior

  });

  it("handles errors and fires events", function(){

    // Set up event listeners
    var eventLog = [];
    var onRun = function(){
      eventLog.push("run");
    };
    var onSuccess = function(){
      eventLog.push("success");
    };
    var onError = function(){
      eventLog.push("error");
    };

    // Create a callback block
    var block = new LiveBlocks.Block(function(){

      this.prop("callback")();
    });

    // Register event listeners
    block.on("run", onRun);
    block.on("success", onSuccess);
    block.on("error", onError);

    // Produce an exception
    block.prop("callback", null);
    expect(block.error()).not.toBeUndefined();
    expect(eventLog.length).toBe(2);
    expect(eventLog[0]).toBe("run");
    expect(eventLog[1]).toBe("error");

    // Clear eventLog
    eventLog.length = 0;

    // Clear the exception
    block.prop("callback", function(){});
    expect(block.error()).toBeUndefined();
    expect(LiveBlocks.hasOwnProperty(block, "_lastError")).toBe(false);
    expect(eventLog.length).toBe(2);
    expect(eventLog[0]).toBe("run");
    expect(eventLog[1]).toBe("success");
  });

  it("prevents infinite .update() loops by throwing an exception", function(){

    // Create a block that will update forever
    var block = new LiveBlocks.Block(function(){

      this.prop("output", !this.prop("output"));
    });

    // Count the number of "run" events
    var runCount = 0;
    block.on("run", function(){
      runCount++;
    });

    // Trigger infinite update loop
    var triggerUpdate = function(){
      block.prop("output", !block.prop("output"));
    };
    expect(triggerUpdate).toThrowError("Infinite update loop detected: reached 1000 iterations");
    expect(runCount).toBe(1000);

    // Set new maxUpdateIterations
    LiveBlocks.Block.setMaxUpdateIterations(100);

    // Reset runCount
    runCount = 0;

    // Trigger infinite update loop
    expect(triggerUpdate).toThrowError("Infinite update loop detected: reached 100 iterations");
    expect(runCount).toBe(100);
  });
});

