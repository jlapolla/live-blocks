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

  it("can take undefined as a value", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Set defined value
    wire.value(1);
    expect(wire.value()).toBe(1);

    // Set undefined value
    wire.value(undefined);
    expect(wire.value()).toBeUndefined();

    // Set defined value
    wire.value(1);
    expect(wire.value()).toBe(1);
  });

  it("fires events on connect, disconnect, and value change", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create logging event listeners
    var log = [];
    var listeners = {};
    (function(list){

      for (var i = 0; i < list.length; i++){

        listeners[list[i]] = (function(eventName){

          return function(arg){

            // Create log object
            var obj = {event: eventName};
            if (typeof arg !== "undefined")
              obj.arg = arg;

            // Add log object to log
            log.push(obj);
          };
        }(list[i]));
      }
    }(["connect", "disconnect", "value"]));

    // Register event listeners
    wire.on("connect", listeners.connect);
    wire.on("disconnect", listeners.disconnect);
    wire.on("value", listeners.value);

    // Create a block
    var noop = function(){};
    var block = new LiveBlocks.WireConstraint({functions: {a: noop, b: noop}});

    // Register event listeners
    wire.on("connect", listeners.connect);
    wire.on("disconnect", listeners.disconnect);
    wire.on("value", listeners.value);
    expect(log.length).toBe(0);

    // Connect pin "a"
    block.connect("a", wire);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("connect");
    expect(log[0].arg.pin).toBe("a");
    expect(log[0].arg.block).toBe(block);

    // Clear log
    log.length = 0;

    // Connect pin "a" again (redundant)
    block.connect("a", wire);
    expect(log.length).toBe(0);

    // Connect pin "b"
    block.connect("b", wire);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("connect");
    expect(log[0].arg.pin).toBe("b");
    expect(log[0].arg.block).toBe(block);

    // Clear log
    log.length = 0;

    // Disconnect pin "a"
    block.disconnect("a", wire);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("disconnect");
    expect(log[0].arg.pin).toBe("a");
    expect(log[0].arg.block).toBe(block);

    // Clear log
    log.length = 0;

    // Disconnect pin "a" again (redundant)
    block.disconnect("a", wire);
    expect(log.length).toBe(0);

    // Set value to undefined (redundant)
    wire.value(undefined);
    expect(log.length).toBe(0);

    // Set value to 1
    wire.value(1);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("value");
    expect(log[0].arg).toBe(1);

    // Clear log
    log.length = 0;

    // Set value to 1 (redundant)
    wire.value(1);
    expect(log.length).toBe(0);

    // Set value to undefined
    wire.value(undefined);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("value");
    expect(log[0].arg).toBeUndefined();
  });

  describe("connection iterator", function(){

    it("iterates over wire connections", function(){

      // Create a few blocks
      var blocks = [];
      var noop = function(){};
      for (var i = 0; i < 3; i++)
        blocks.push(new LiveBlocks.WireConstraint({functions: {a: noop}}));

      // Create a wire
      var wire = new LiveBlocks.Wire();

      // Connect blocks 0 and 1 to wire
      blocks[0].connect("a", wire);
      blocks[1].connect("a", wire);

      // Get connection iterator
      var it = wire.connections();
      expect(it.has({block: blocks[0], pin: "a"})).toBe(true);
      expect(it.has({block: blocks[0], pin: "b"})).toBe(false);
      expect(it.has({block: blocks[2], pin: "a"})).toBe(false);
      expect(it.peek().pin).toBe("a");
      expect(it.peek().block).toBe(blocks[0]);

      // Move to next connection
      var connection = it.next();
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[0]);
      expect(it.peek().pin).toBe("a");
      expect(it.peek().block).toBe(blocks[1]);

      // Move to next connection
      connection = it.next();
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[1]);
      expect(it.peek()).toBeUndefined();

      // Move to next connection
      connection = it.next();
      expect(connection).toBeUndefined();
      expect(it.has({block: blocks[0], pin: "a"})).toBe(true);
      expect(it.has({block: blocks[0], pin: "b"})).toBe(false);
      expect(it.has({block: blocks[2], pin: "a"})).toBe(false);

      // Add a new connection
      blocks[2].connect("a", wire);

      // Reset iterator
      it.reset();
      expect(it.has({block: blocks[0], pin: "a"})).toBe(true);
      expect(it.has({block: blocks[0], pin: "b"})).toBe(false);
      expect(it.has({block: blocks[2], pin: "a"})).toBe(false);

      // Move to next connection
      connection = it.next();
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[0]);

      // Move to next connection
      connection = it.next();
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[1]);

      // Move to next connection
      connection = it.next();
      expect(connection).toBeUndefined();
      expect(it.has({block: blocks[0], pin: "a"})).toBe(true);
      expect(it.has({block: blocks[0], pin: "b"})).toBe(false);
      expect(it.has({block: blocks[2], pin: "a"})).toBe(false);

      // Get new iterator
      it = wire.connections();
      expect(it.has({block: blocks[0], pin: "a"})).toBe(true);
      expect(it.has({block: blocks[0], pin: "b"})).toBe(false);
      expect(it.has({block: blocks[2], pin: "a"})).toBe(true);

      // Move to next connection
      connection = it.next();
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[0]);

      // Move to next connection
      connection = it.next();
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[1]);

      // Move to next connection
      connection = it.next();
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[2]);

      // Move to next connection
      connection = it.next();
      expect(connection).toBeUndefined();
      expect(it.has({block: blocks[0], pin: "a"})).toBe(true);
      expect(it.has({block: blocks[0], pin: "b"})).toBe(false);
      expect(it.has({block: blocks[2], pin: "a"})).toBe(true);
    });
  });
});

