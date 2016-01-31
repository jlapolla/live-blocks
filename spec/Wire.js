"use strict";

describe("Wire class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("duplicates itself with custom equalTo() function", function(){

    // Create equalTo function
    var neverEqual = function(){return false;};

    // Create a wire
    var wire = new LiveBlocks.Wire({equalTo: neverEqual});

    // Duplicate wire
    var duplicate = wire.duplicate();
    duplicate.value(false);
    expect(duplicate.equalTo).toBe(neverEqual);
  });

  it("duplicates itself with custom queue object", function(){

    // Create fake queue
    var duplicateQueue = {};
    var queue = {duplicate: function(){return duplicateQueue;}};

    // Create a wire
    var wire = new LiveBlocks.Wire({queue: queue});

    // Duplicate wire
    var duplicate = wire.duplicate();
    expect(duplicate._valueQueue).toBe(duplicateQueue);
    expect(LiveBlocks.hasOwnProperty(duplicate, "equalTo")).toBe(false);
  });

  it("does not bind duplicate block properties", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var updateLog = [];
    var update = function(prop){

      updateLog.push({block: this, prop: prop});
    };
    var blocks = [];
    for (var i = 0; i < 2; i++)
      blocks.push({update: update});

    // Bind block properties to wire
    wire.bind(blocks[0], "0");
    wire.bind(blocks[0], "1");
    wire.bind(blocks[1], "0");
    wire.bind(blocks[1], "1");
    wire.notify();
    expect(updateLog.length).toBe(4);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("0");
    expect(updateLog[1].block).toBe(blocks[0]);
    expect(updateLog[1].prop).toBe("1");
    expect(updateLog[2].block).toBe(blocks[1]);
    expect(updateLog[2].prop).toBe("0");
    expect(updateLog[3].block).toBe(blocks[1]);
    expect(updateLog[3].prop).toBe("1");

    // Clear updateLog
    updateLog.length = 0;

    // Bind duplicate block property to wire
    wire.bind(blocks[0], "0");
    wire.notify();
    expect(updateLog.length).toBe(4);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("0");
    expect(updateLog[1].block).toBe(blocks[0]);
    expect(updateLog[1].prop).toBe("1");
    expect(updateLog[2].block).toBe(blocks[1]);
    expect(updateLog[2].prop).toBe("0");
    expect(updateLog[3].block).toBe(blocks[1]);
    expect(updateLog[3].prop).toBe("1");
  });

  it("unbinds block properties", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var updateLog = [];
    var update = function(prop){

      updateLog.push({block: this, prop: prop});
    };
    var blocks = [];
    for (var i = 0; i < 2; i++)
      blocks.push({update: update});

    // Bind block properties to wire
    wire.bind(blocks[0], "0");
    wire.bind(blocks[0], "1");
    wire.bind(blocks[1], "0");
    wire.bind(blocks[1], "1");
    wire.notify();
    expect(updateLog.length).toBe(4);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("0");
    expect(updateLog[1].block).toBe(blocks[0]);
    expect(updateLog[1].prop).toBe("1");
    expect(updateLog[2].block).toBe(blocks[1]);
    expect(updateLog[2].prop).toBe("0");
    expect(updateLog[3].block).toBe(blocks[1]);
    expect(updateLog[3].prop).toBe("1");

    // Clear updateLog
    updateLog.length = 0;

    // Bind duplicate block property to wire
    wire.unbind(blocks[0], "0");
    wire.notify();
    expect(updateLog.length).toBe(3);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("1");
    expect(updateLog[1].block).toBe(blocks[1]);
    expect(updateLog[1].prop).toBe("0");
    expect(updateLog[2].block).toBe(blocks[1]);
    expect(updateLog[2].prop).toBe("1");
  });

  it("does nothing when a non-existent binding is unbound", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var updateLog = [];
    var update = function(prop){

      updateLog.push({block: this, prop: prop});
    };
    var blocks = [];
    for (var i = 0; i < 2; i++)
      blocks.push({update: update});

    // Bind block properties to wire
    wire.bind(blocks[0], "0");
    wire.bind(blocks[0], "1");
    wire.bind(blocks[1], "0");
    wire.bind(blocks[1], "1");
    wire.notify();
    expect(updateLog.length).toBe(4);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("0");
    expect(updateLog[1].block).toBe(blocks[0]);
    expect(updateLog[1].prop).toBe("1");
    expect(updateLog[2].block).toBe(blocks[1]);
    expect(updateLog[2].prop).toBe("0");
    expect(updateLog[3].block).toBe(blocks[1]);
    expect(updateLog[3].prop).toBe("1");

    // Clear updateLog
    updateLog.length = 0;

    // Bind duplicate block property to wire
    wire.unbind(blocks[0], "noexist");
    wire.unbind({}, "0");
    wire.notify();
    expect(updateLog.length).toBe(4);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("0");
    expect(updateLog[1].block).toBe(blocks[0]);
    expect(updateLog[1].prop).toBe("1");
    expect(updateLog[2].block).toBe(blocks[1]);
    expect(updateLog[2].prop).toBe("0");
    expect(updateLog[3].block).toBe(blocks[1]);
    expect(updateLog[3].prop).toBe("1");
  });

  it(".notify() ignores blocks bound or unbound during .notify()", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var blocks = [];
    var updateLog = [];
    var update = function(prop){

      updateLog.push({block: this, prop: prop});
      wire.unbind(blocks[2], "2");
      wire.bind(blocks[3], "3");
    };
    for (var i = 0; i < 4; i++)
      blocks.push({update: update});

    // Bind block properties to wire
    wire.bind(blocks[0], "0");
    wire.bind(blocks[1], "1");
    wire.bind(blocks[2], "2");
    wire.notify();
    expect(updateLog.length).toBe(3);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("0");
    expect(updateLog[1].block).toBe(blocks[1]);
    expect(updateLog[1].prop).toBe("1");
    expect(updateLog[2].block).toBe(blocks[2]);
    expect(updateLog[2].prop).toBe("2");

    // Clear updateLog
    updateLog.length = 0;

    // Notify again
    wire.notify();
    expect(updateLog.length).toBe(3);
    expect(updateLog[0].block).toBe(blocks[0]);
    expect(updateLog[0].prop).toBe("0");
    expect(updateLog[1].block).toBe(blocks[1]);
    expect(updateLog[1].prop).toBe("1");
    expect(updateLog[2].block).toBe(blocks[3]);
    expect(updateLog[2].prop).toBe("3");
  });

  it("runs .notify() when values are set", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var values = [];
    var updateLog = [];
    var update = function(prop){

      updateLog.push(wire.value());

      for (var i = 0; i < values.length; i++)
        wire.value(values[i]);

      values = [];
    };
    var blocks = [];
    for (var i = 0; i < 1; i++)
      blocks.push({update: update});

    // Bind block to wire
    wire.bind(blocks[0], "0");

    // Set up values
    var nan = 0/(function(){}());
    values = ["b", "c", "c", nan, nan, "d"];

    // Set wire value
    wire.value("a");
    expect(updateLog.length).toBe(5);
    expect(updateLog).toEqual(["a", "b", "c", nan, "d"]);
    expect(nan).not.toBe(nan); // Just to make sure we have a true NaN value
  });

  it("detects infinite loops", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create a block that will cause an infinite loop
    var block = {update: function(){wire.value(!wire.value());}};

    // Bind block properties
    wire.bind(block, "x");

    // Create infinite loop
    var triggerLoop = function(){
      wire.value(!wire.value());
    };
    expect(triggerLoop).toThrowError("Infinite loop detected: reached 1000 iterations");

    // Set new maxIterations
    LiveBlocks.Wire.setMaxIterations(100);
    expect(triggerLoop).toThrowError("Infinite loop detected: reached 100 iterations");
  });
});

