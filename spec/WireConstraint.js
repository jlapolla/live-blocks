"use strict";

describe("WireConstraint class", function(){

  var host = window;

  var LiveBlocks = host.LiveBlocks;

  it("integration test with Wire class where a wire has multiple connections", function(){

    // Update log
    var log = [];

    // Make blocks
    var plusOne = new LiveBlocks.WireConstraint((function(){

      // Make constraint functions
      var smaller2bigger = function(){

        this.bigger = this.smaller + 1;
        log.push("smaller2bigger");
      };
      var bigger2smaller = function(){

        this.smaller = this.bigger - 1;
        log.push("bigger2smaller");
      };

      // Return function hash
      return {functions: {bigger: bigger2smaller, smaller: smaller2bigger}};
    }()));
    var timesTwo = new LiveBlocks.WireConstraint((function(){

      // Make constraint functions
      var half2double = function(){

        this.double = this.half * 2;
        log.push("half2double");
      };
      var double2half = function(){

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

    // Connect block properties to wires
    plusOne.connect("smaller", wires[0]);
    plusOne.connect("bigger", wires[1]);
    timesTwo.connect("half", wires[1]);
    timesTwo.connect("double", wires[2]);

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
    timesTwo.disconnect("half");
    expect(log).toEqual(["half2double", "double2half"]);
    timesTwo.disconnect("double");
    expect(log).toEqual(["half2double", "double2half", "double2half"]);

    // Clear update log
    log.length = 0;

    // Rewire blocks
    timesTwo.connect("half", wires[2]);
    timesTwo.connect("double", wires[1]);
    expect(wires[0].value()).toBe(3);
    expect(wires[1].value()).toBe(4);
    expect(wires[2].value()).toBe(2);
    expect(log).toEqual(["half2double", "double2half", "half2double"]);
  });

  it("integration test with Wire class where the WireConstraint has multiple inputs and outputs", function(){

    // Convert rectangular to polar coordinates
    var block = new LiveBlocks.WireConstraint((function(Math, isFinite, Error){

      var atan2 = Math.atan2;
      var cos = Math.cos;
      var sin = Math.sin;
      var sqrt = Math.sqrt;
      var assertFiniteNumber = function(num){

        if (!(typeof num === "number" && isFinite(num)))
          throw new Error(num + " must be a number");
      };

      var rect2polar = function(){

        assertFiniteNumber(this.x);
        assertFiniteNumber(this.y);

        this.r = sqrt(this.x * this.x + this.y * this.y);
        this.theta = atan2(this.y, this.x);
      };

      var polar2rect = function(){

        assertFiniteNumber(this.r);
        assertFiniteNumber(this.theta);

        this.x = this.r * cos(this.theta);
        this.y = this.r * sin(this.theta);
      };

      var functions = {
        x: rect2polar,
        y: rect2polar,
        r: polar2rect,
        theta: polar2rect
      };

      return {functions: functions};
    }(host.Math, host.isFinite, host.Error)));

    // Make wires
    var wires = {};
    var equalTo = (function(Math, isFinite){

      var abs = Math.abs;
      var epsilon = 1e-14;

      return function(value){

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
    }(host.Math, host.isFinite));
    (function(wireNames){

      for (var i = 0; i < wireNames.length; i++)
        wires[wireNames[i]] = new LiveBlocks.Wire({equalTo: equalTo});
    }(["x", "y", "r", "theta"]));

    // Register logging event listeners
    var log = [];
    block.on("update", function(pin){

      log.push(pin.pin);
    });
    block.on("success", function(){

      log.push("success");
    });
    block.on("error", function(){

      log.push("error");
    });

    // Connect wires to block pins
    block.connect("x", wires.x);
    block.connect("y", wires.y);
    block.connect("r", wires.r);
    block.connect("theta", wires.theta);

    // Clear log
    log.length = 0;

    // Test input
    wires.x.value(1);
    expect(log).toEqual(["x", "error"]);
    expect(wires.x.equalTo(1)).toBe(true);
    expect(wires.y.value()).toBeUndefined();
    expect(wires.r.value()).toBeUndefined();
    expect(wires.theta.value()).toBeUndefined();
    expect(block.error()).not.toBeUndefined();

    // Test input
    wires.y.value(0);
    expect(wires.x.equalTo(1)).toBe(true);
    expect(wires.y.equalTo(0)).toBe(true);
    expect(wires.r.equalTo(1)).toBe(true);
    expect(wires.theta.equalTo(0)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Test input
    wires.r.value(2);
    expect(wires.x.equalTo(2)).toBe(true);
    expect(wires.y.equalTo(0)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(0)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Clear log
    log.length = 0;

    // Test input
    wires.theta.value(Math.PI/2);
    expect(log).toEqual(["theta", "success", "x", "success", "y", "success"]);
    expect(wires.x.equalTo(0)).toBe(true);
    expect(wires.y.equalTo(2)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(Math.PI/2)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Test input
    wires.theta.value(Math.PI * 15/4);
    expect(wires.x.equalTo(2 / Math.SQRT2)).toBe(true);
    expect(wires.y.equalTo(-2 / Math.SQRT2)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(-Math.PI/4)).toBe(true);
    expect(block.error()).toBeUndefined();

    // Test input
    wires.theta.value(undefined);
    expect(wires.x.equalTo(2 / Math.SQRT2)).toBe(true);
    expect(wires.y.equalTo(-2 / Math.SQRT2)).toBe(true);
    expect(wires.r.equalTo(2)).toBe(true);
    expect(wires.theta.equalTo(undefined)).toBe(true);
    expect(wires.theta.value()).toBeUndefined();
    expect(block.error()).not.toBeUndefined();
  });

  it("integration test with read-only values", function(){

    // We will make a flip flop from two cross-coupled NOR gates

    // Make two NOR blocks
    var norQ = new LiveBlocks.WireConstraint((function(){

      var func = function(){

        this.out = !(this.a || this.b)
      };

      var functions = {
        a: func,
        b: func,
        out: func
      };

      return {functions: functions};
    }()));
    var norNotQ = norQ.duplicate();

    // Make some wires
    var R = new LiveBlocks.Wire();
    var S = new LiveBlocks.Wire();
    var Q = new LiveBlocks.Wire();
    var notQ = new LiveBlocks.Wire();

    // Connect blocks to wires
    norQ.connect("out", Q);
    norQ.connect("a", R);
    norQ.connect("b", notQ);
    norNotQ.connect("out", notQ);
    norNotQ.connect("a", Q);
    norNotQ.connect("b", S);

    // Set the flip flop
    R.value(false);
    S.value(true);
    S.value(false);
    expect(R.value()).toBe(false);
    expect(S.value()).toBe(false);
    expect(Q.value()).toBe(true);
    expect(notQ.value()).toBe(false);

    // Reset the flip flop
    R.value(true);
    R.value(false);
    expect(R.value()).toBe(false);
    expect(S.value()).toBe(false);
    expect(Q.value()).toBe(false);
    expect(notQ.value()).toBe(true);
  });

  it("duplicates injected queue dependencies", function(){

    // Create a fake queue
    var queue2 = {};
    var queue = {duplicate: function(){return queue2;}};

    // Create a wire constraint
    var wc = new LiveBlocks.WireConstraint({queue: queue});
    expect(wc._updateQueue).toBe(queue);

    // Duplicate wire constraint
    var duplicate = wc.duplicate();
    expect(duplicate._updateQueue).toBe(queue2);
  });

  it("duplicates injected function dependencies", function(){

    // Create function hash
    var fnHash = {
      a: function(){},
      b: function(){}
    };

    // Create a wire constraint
    var wc = new LiveBlocks.WireConstraint({functions: fnHash});
    expect(wc._functions).not.toBe(fnHash);
    expect(wc._functions).toEqual(fnHash);

    // Duplicate wire constraint
    var duplicate = wc.duplicate();
    expect(duplicate._functions).not.toBe(wc._functions);
    expect(duplicate._functions).toEqual(fnHash);
  });

  it("creates a default queue when no queue is injected", function(){

    // Create a wire constraint
    var wc = new LiveBlocks.WireConstraint();
    expect(wc._updateQueue).not.toBeUndefined();
  });

  it("disconnects pin from wire before connecting to a new wire", function(){

    // Create a block
    var block = new LiveBlocks.WireConstraint({functions: {x: function(){}}});

    // Create wires which log their binding events
    var log = [];
    var bindFn = (function(bind){

      return function(block, prop){

        // Log bind call
        log.push({function: "bind", block: block, prop: prop});

        // Call through
        return bind.call(this, block, prop);
      };
    }(LiveBlocks.Wire.prototype.bind));
    var unbindFn = (function(unbind){

      return function(block, prop){

        // Log unbind call
        log.push({function: "unbind", block: block, prop: prop});

        // Call through
        return unbind.call(this, block, prop);
      };
    }(LiveBlocks.Wire.prototype.unbind));
    var wires = [];
    for (var i = 0; i < 2; i++) {

      // Create wire
      var wire = new LiveBlocks.Wire();

      // Add logging bind and unbind functions
      wire.bind = bindFn;
      wire.unbind = unbindFn;

      // Add wire to wires list
      wires.push(wire);
    }

    // Connect block to wire 0
    block.connect("x", wires[0]);
    expect(log.length).toBe(1);
    expect(log[0].function).toBe("bind");
    expect(log[0].block).toBe(block);
    expect(log[0].prop).toBe("x");

    // Clear log
    log.length = 0;

    // Connect block to wire 1
    block.connect("x", wires[1]);
    expect(log.length).toBe(2);
    expect(log[0].function).toBe("unbind");
    expect(log[0].block).toBe(block);
    expect(log[0].prop).toBe("x");
    expect(log[1].function).toBe("bind");
    expect(log[1].block).toBe(block);
    expect(log[1].prop).toBe("x");
  });

  it("treats disconnected pin as undefined", function(){


    // Create a passthrough block
    var block = new LiveBlocks.WireConstraint({
      functions: {
        a: function(){

          // Copy "a" to "b"
          this.b = this.a;
        },
        b: function(){

          // Copy "b" to "a"
          this.a = this.b;
        }
      }
    });

    // Create wires
    var wireA = new LiveBlocks.Wire();
    var wireB = new LiveBlocks.Wire();

    // Set values on wires
    wireA.value("a");
    wireB.value("b");

    // Connect wires to block
    block.connect("a", wireA);
    block.connect("b", wireB);
    expect(wireA.value()).toBe("b");
    expect(wireB.value()).toBe("b");

    // Test stimulus
    wireA.value(undefined);
    expect(wireA.value()).toBeUndefined();
    expect(wireB.value()).toBeUndefined();

    // Test stimulus
    wireA.value("a");
    expect(wireA.value()).toBe("a");
    expect(wireB.value()).toBe("a");

    // Disconnect pin "b"
    block.disconnect("a");
    expect(wireA.value()).toBe("a");
    expect(wireB.value()).toBeUndefined();

    // Test stimulus
    wireA.value("b");
    expect(wireA.value()).toBe("b");
    expect(wireB.value()).toBeUndefined();
  });

  it("throws error when connecting to non-existent pin", function(){

    // Create a block with no pins
    var block = new LiveBlocks.WireConstraint();

    // Create a wire
    var wire = new LiveBlocks.Wire();

    // Connect to non-existent pin
    expect(function(){
      block.connect("x", wire);
    }).toThrowError("Pin \"x\" not found");
  });

  it("catches exceptions in pin functions", function(){

    // Create a block that throws error
    var block = new LiveBlocks.WireConstraint({
      functions: {
        a: function(){

          // Throw error if "a" is not a number
          if (typeof this.a !== "number")
            throw new TypeError("Pin \"a\" must be a number");

          // Copy "a" to "b"
          this.b = this.a;
        },
        b: function(){

          // Throw error if "b" is not a number
          if (typeof this.b !== "number")
            throw new TypeError("Pin \"b\" must be a number");

          // Copy "b" to "a"
          this.a = this.b;
        }
      }
    });

    // Create wires
    var wireA = new LiveBlocks.Wire();
    var wireB = new LiveBlocks.Wire();

    // Connect wires to block
    block.connect("a", wireA);
    block.connect("b", wireB);
    expect(block.error().message).toBe("Pin \"b\" must be a number");

    // Clear error
    wireA.value(1);
    expect(block.error()).toBeUndefined();
    expect(wireB.value()).toBe(1);
  });

  it("fires events on update, success, and error", function(){

    // Create a block that throws error
    var block = new LiveBlocks.WireConstraint({
      functions: {
        a: function(){

          // Throw error if "a" is not a number
          if (typeof this.a !== "number")
            throw new TypeError("Pin \"a\" must be a number");

          // Copy "a" to "b"
          this.b = this.a;
        },
        b: function(){

          // Throw error if "b" is not a number
          if (typeof this.b !== "number")
            throw new TypeError("Pin \"b\" must be a number");

          // Copy "b" to "a"
          this.a = this.b;
        }
      }
    });

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
    }(["update", "success", "error"]));

    // Attach event listeners
    block.on("update", listeners.update);
    block.on("success", listeners.success);
    block.on("error", listeners.error);

    // Create wires
    var wireA = new LiveBlocks.Wire();
    var wireB = new LiveBlocks.Wire();

    // Connect wireA to block
    block.connect("a", wireA);
    expect(log[0].event).toBe("update");
    expect(log[0].arg).toEqual({pin: "a", value: undefined});
    expect(log[1].event).toBe("error");
    expect(log[1].arg.message).toBe("Pin \"a\" must be a number");
    expect(log.length).toBe(2);

    // Clear log
    log.length = 0;

    // Connect wireB to block
    block.connect("b", wireB);
    expect(log[0].event).toBe("update");
    expect(log[0].arg).toEqual({pin: "b", value: undefined});
    expect(log[1].event).toBe("error");
    expect(log[1].arg.message).toBe("Pin \"b\" must be a number");
    expect(log.length).toBe(2);

    // Clear log
    log.length = 0;

    // Clear error
    wireA.value(1);
    expect(log[0].event).toBe("update");
    expect(log[0].arg).toEqual({pin: "a", value: 1});
    expect(log[1].event).toBe("success");
    expect(log[1].arg).toBeUndefined();
    expect(log[2].event).toBe("update");
    expect(log[2].arg).toEqual({pin: "b", value: 1});
    expect(log[3].event).toBe("success");
    expect(log[3].arg).toBeUndefined();
    expect(log.length).toBe(4);
  });

  it("fires events on pin connect and disconnect", function(){

    // Create a block
    var noop = function(){};
    var block = new LiveBlocks.WireConstraint({functions: {a: noop, b: noop}});

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
    }(["connect", "disconnect"]));

    // Create wires
    var wires = [];
    for (var i = 0; i < 2; i++)
      wires.push(new LiveBlocks.Wire());

    // Register event listeners
    block.on("connect", listeners.connect);
    block.on("disconnect", listeners.disconnect);
    expect(log.length).toBe(0);

    // Connect pin "a"
    block.connect("a", wires[0]);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("connect");
    expect(log[0].arg.pin).toBe("a");
    expect(log[0].arg.wire).toBe(wires[0]);

    // Clear log
    log.length = 0;

    // Connect pin "b"
    block.connect("b", wires[1]);
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("connect");
    expect(log[0].arg.pin).toBe("b");
    expect(log[0].arg.wire).toBe(wires[1]);

    // Clear log
    log.length = 0;

    // Reconnect pin "a"
    block.connect("a", wires[1]);
    expect(log.length).toBe(2);
    expect(log[0].event).toBe("disconnect");
    expect(log[0].arg.pin).toBe("a");
    expect(log[0].arg.wire).toBe(wires[0]);
    expect(log[1].event).toBe("connect");
    expect(log[1].arg.pin).toBe("a");
    expect(log[1].arg.wire).toBe(wires[1]);

    // Clear log
    log.length = 0;

    // Disconnect pin "b"
    block.disconnect("b");
    expect(log.length).toBe(1);
    expect(log[0].event).toBe("disconnect");
    expect(log[0].arg.pin).toBe("b");
    expect(log[0].arg.wire).toBe(wires[1]);
  });

  describe("pin iterator", function(){

    it("iterates over block pins", function(){

      // Create a block that throws error
      var block = new LiveBlocks.WireConstraint((function(){
        var noop = function(){};
        var functions = {a: noop, b: noop};
        return {functions: functions};
      }()));

      // Create wires
      var wireA = new LiveBlocks.Wire();

      // Connect wires to block
      block.connect("a", wireA);

      // Get pin iterator
      var it = block.pins();

      // Peek at next pin
      expect(it.peek().pin).toBe("a");
      expect(it.peek().wire).toBe(wireA);

      // Get next pin
      var pin = it.next();
      expect(pin.pin).toBe("a");
      expect(pin.wire).toBe(wireA);

      // Check has() function
      expect(it.has("a")).toBe(true);
      expect(it.has("b")).toBe(true);
      expect(it.has("c")).toBe(false);

      // Get next pin
      pin = it.next();
      expect(pin.pin).toBe("b");
      expect(pin.wire).toBeUndefined();

      // We are at the end of the iterator
      expect(it.peek()).toBeUndefined();
      expect(it.next()).toBeUndefined();

      // Reset iterator
      it.reset();

      // Peek at next pin
      expect(it.peek().pin).toBe("a");
      expect(it.peek().wire).toBe(wireA);

      // Disconnect wire
      // Iterator should not change
      // Need to get a new iterator to see latest pins
      block.disconnect("a");
      expect(it.peek().pin).toBe("a");
      expect(it.peek().wire).toBe(wireA);

      // Get new iterator
      it = block.pins();
      expect(it.peek().pin).toBe("a");
      expect(it.peek().wire).toBeUndefined();
    });
  });
});

