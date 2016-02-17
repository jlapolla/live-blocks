"use strict";

describe("Wire class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("duplicates injected equalTo dependencies", function(){

    // Create equalTo function
    var neverEqual = function(){return false;};

    // Create a wire
    var wire = new LiveBlocks.Wire({equalTo: neverEqual});
    expect(wire.equalTo).toBe(neverEqual);

    // Duplicate wire
    var duplicate = wire.duplicate();
    expect(duplicate.equalTo).toBe(neverEqual);
  });

  it("duplicates itself with custom queue object", function(){

    // Create fake queue
    var queue2 = {};
    var queue = {duplicate: function(){return queue2;}};

    // Create a wire
    var wire = new LiveBlocks.Wire({queue: queue});
    expect(wire._valueQueue).toBe(queue);

    // Duplicate wire
    var duplicate = wire.duplicate();
    expect(duplicate._valueQueue).toBe(queue2);
    expect(LiveBlocks.hasOwnProperty(duplicate, "equalTo")).toBe(false);
  });

  it("does not bind duplicate block pins", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var log = [];
    var update = function(pin){

      log.push({block: this, pin: pin});
    };
    var blocks = [];
    for (var i = 0; i < 2; i++)
      blocks.push({update: update});

    // Bind block pins to wire
    wire.bind(blocks[0], "0");
    wire.bind(blocks[0], "1");
    wire.bind(blocks[1], "0");
    wire.bind(blocks[1], "1");
    wire.notify();
    expect(log.length).toBe(4);
    expect(log[0].block).toBe(blocks[0]);
    expect(log[0].pin).toBe("0");
    expect(log[1].block).toBe(blocks[0]);
    expect(log[1].pin).toBe("1");
    expect(log[2].block).toBe(blocks[1]);
    expect(log[2].pin).toBe("0");
    expect(log[3].block).toBe(blocks[1]);
    expect(log[3].pin).toBe("1");

    // Clear log
    log.length = 0;

    // Bind duplicate block pin to wire
    wire.bind(blocks[0], "0");
    wire.notify();
    expect(log.length).toBe(4);
    expect(log[0].block).toBe(blocks[0]);
    expect(log[0].pin).toBe("0");
    expect(log[1].block).toBe(blocks[0]);
    expect(log[1].pin).toBe("1");
    expect(log[2].block).toBe(blocks[1]);
    expect(log[2].pin).toBe("0");
    expect(log[3].block).toBe(blocks[1]);
    expect(log[3].pin).toBe("1");
  });

  it("unbinds block pins", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var log = [];
    var update = function(pin){

      log.push({block: this, pin: pin});
    };
    var blocks = [];
    for (var i = 0; i < 2; i++)
      blocks.push({update: update});

    // Bind block pins to wire
    wire.bind(blocks[0], "0");
    wire.bind(blocks[0], "1");
    wire.bind(blocks[1], "0");
    wire.bind(blocks[1], "1");
    wire.notify();
    expect(log.length).toBe(4);
    expect(log[0].block).toBe(blocks[0]);
    expect(log[0].pin).toBe("0");
    expect(log[1].block).toBe(blocks[0]);
    expect(log[1].pin).toBe("1");
    expect(log[2].block).toBe(blocks[1]);
    expect(log[2].pin).toBe("0");
    expect(log[3].block).toBe(blocks[1]);
    expect(log[3].pin).toBe("1");

    // Clear log
    log.length = 0;

    // Unbind block pin
    wire.unbind(blocks[0], "0");
    wire.notify();
    expect(log.length).toBe(3);
    expect(log[0].block).toBe(blocks[0]);
    expect(log[0].pin).toBe("1");
    expect(log[1].block).toBe(blocks[1]);
    expect(log[1].pin).toBe("0");
    expect(log[2].block).toBe(blocks[1]);
    expect(log[2].pin).toBe("1");

    // Clear log
    log.length = 0;

    // Unbind non-existent pins (redundant)
    wire.unbind(blocks[0], "0");
    wire.unbind(blocks[0], "a");
    wire.unbind({}, "1");
    wire.notify();
    expect(log.length).toBe(3);
    expect(log[0].block).toBe(blocks[0]);
    expect(log[0].pin).toBe("1");
    expect(log[1].block).toBe(blocks[1]);
    expect(log[1].pin).toBe("0");
    expect(log[2].block).toBe(blocks[1]);
    expect(log[2].pin).toBe("1");
  });

  it(".notify() ignores blocks bound or unbound during .notify()", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var blocks = [];
    var log = [];
    var update = function(prop){

      log.push({block: this, prop: prop});
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
    expect(log.length).toBe(3);
    expect(log[0].block).toBe(blocks[0]);
    expect(log[0].prop).toBe("0");
    expect(log[1].block).toBe(blocks[1]);
    expect(log[1].prop).toBe("1");
    expect(log[2].block).toBe(blocks[2]);
    expect(log[2].prop).toBe("2");

    // Clear log
    log.length = 0;

    // Notify again
    wire.notify();
    expect(log.length).toBe(3);
    expect(log[0].block).toBe(blocks[0]);
    expect(log[0].prop).toBe("0");
    expect(log[1].block).toBe(blocks[1]);
    expect(log[1].prop).toBe("1");
    expect(log[2].block).toBe(blocks[3]);
    expect(log[2].prop).toBe("3");
  });

  it("handles values set during .notify()", function(){

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Create some fake blocks
    var values = [];
    var log = [];
    var update = function(prop){

      log.push(wire.value());

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
    expect(log.length).toBe(5);
    expect(log).toEqual(["a", "b", "c", nan, "d"]);
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

  it("handles wire contention issues", function(){

    // Create prototype NOT block
    var not = new LiveBlocks.WireConstraint((function(){

      var aToB = function(){

        this.b = !this.a;
      };

      var functions = {
        a: aToB,
        b: aToB
      };

      return {functions: functions};
    }()));

    // Create blocks
    var blocks = [];
    for (var i = 0; i < 2; i++)
      blocks.push(not.duplicate());

    // Create wires
    var wires = [];
    for (var i = 0; i < 3; i++)
      wires.push(new LiveBlocks.Wire());

    // Connect blocks and wires
    blocks[0].connect("a", wires[0]);
    blocks[0].connect("b", wires[1]);
    blocks[1].connect("a", wires[1]);
    blocks[1].connect("b", wires[2]);

    // Set undefined value on wires[1]
    expect(function(){

      wires[1].value(undefined);
    }).not.toThrow();
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
      expect(it.peek().done).toBe(false);
      expect(it.peek().value.pin).toBe("a");
      expect(it.peek().value.block).toBe(blocks[0]);

      // Move to next connection
      var connection = it.next().value;
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[0]);
      expect(it.peek().done).toBe(false);
      expect(it.peek().value.pin).toBe("a");
      expect(it.peek().value.block).toBe(blocks[1]);

      // Move to next connection
      connection = it.next().value;
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[1]);
      expect(it.peek().done).toBe(true);
      expect(it.peek().value).toBeUndefined();

      // Move to next connection
      connection = it.next().value;
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
      connection = it.next().value;
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[0]);

      // Move to next connection
      connection = it.next().value;
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[1]);

      // Move to next connection
      connection = it.next().value;
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
      connection = it.next().value;
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[0]);

      // Move to next connection
      connection = it.next().value;
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[1]);

      // Move to next connection
      connection = it.next().value;
      expect(connection.pin).toBe("a");
      expect(connection.block).toBe(blocks[2]);

      // Move to next connection
      connection = it.next().value;
      expect(connection).toBeUndefined();
      expect(it.has({block: blocks[0], pin: "a"})).toBe(true);
      expect(it.has({block: blocks[0], pin: "b"})).toBe(false);
      expect(it.has({block: blocks[2], pin: "a"})).toBe(true);
    });
  });
});

