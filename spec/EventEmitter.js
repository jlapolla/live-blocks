"use strict";

(function(classNames){

  for (var i = 0; i < classNames.length; i++){

    (function(name){

      describe(name + " class", function(){

        var LiveBlocks = window.LiveBlocks;

        it("does not register duplicate listeners", function(){

          // Create an EventEmitter
          var emitter = new LiveBlocks[name]();
          expect(emitter._listeners).toEqual({});
          
          // Attach the first listener
          var listeners = [function(){}, function(){}, function(){}];
          emitter.on("x", listeners[0]);
          expect(emitter._listeners).toEqual({"x": [listeners[0]]});

          // Attach a new listener
          emitter.on("x", listeners[1]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]]});

          // Attach the same listener again
          emitter.on("x", listeners[0]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]]});

          // Attach two different listeners to "y"
          emitter.on("y", listeners[0]);
          emitter.on("y", listeners[2]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]], "y": [listeners[0], listeners[2]]});
        });

        it("does not delete a listener list if any listeners remain", function(){

          // Create an emitter
          var emitter = new LiveBlocks[name]();
          expect(emitter._listeners).toEqual({});

          // Attach some listeners
          var listeners = [function(){}, function(){}, function(){}];
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);
          emitter.on("y", listeners[0]);
          emitter.on("y", listeners[2]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]], "y": [listeners[0], listeners[2]]});

          // Detach first "x" listener
          emitter.off("x", listeners[0]);
          expect(emitter._listeners).toEqual({"x": [listeners[1]], "y": [listeners[0], listeners[2]]});
        });

        it("deletes a listener list when the last listener is deregistered", function(){

          // Create an emitter
          var emitter = new LiveBlocks[name]();
          expect(emitter._listeners).toEqual({});

          // Attach some listeners
          var listeners = [function(){}, function(){}, function(){}];
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);
          emitter.on("y", listeners[0]);
          emitter.on("y", listeners[2]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]], "y": [listeners[0], listeners[2]]});

          // Detach all "x" listeners
          emitter.off("x", listeners[0]);
          emitter.off("x", listeners[1]);
          expect(emitter._listeners).toEqual({"y": [listeners[0], listeners[2]]});
        });

        it("does nothing when a non-existent listener is deregistered", function(){

          // Create an emitter
          var emitter = new LiveBlocks[name]();
          expect(emitter._listeners).toEqual({});

          // Attach some listeners
          var listeners = [function(){}, function(){}, function(){}];
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);
          emitter.on("y", listeners[0]);
          emitter.on("y", listeners[2]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]], "y": [listeners[0], listeners[2]]});

          // Detach non-existent listener
          emitter.off("x", listeners[2]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]], "y": [listeners[0], listeners[2]]});
        });

        it("does nothing when a listener is deregistered from an un-watched event", function(){

          // Create an emitter
          var emitter = new LiveBlocks[name]();
          expect(emitter._listeners).toEqual({});

          // Attach some listeners
          var listeners = [function(){}, function(){}, function(){}];
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]]});

          // Detach from an un-watched event
          emitter.off("y", listeners[0]);
          expect(emitter._listeners).toEqual({"x": [listeners[0], listeners[1]]});
        });

        it(".fire() function calls each listener once", function(){

          // Create a emitter
          var emitter = new LiveBlocks[name]();

          // Set up listeners
          var listeners = [], callbackLog = [];
          for (var i = 0; i < 3; i++){

            listeners.push((function(listeners, i){

              return function(arg){

                if (typeof arg !== "undefined")
                  callbackLog.push({callback: listeners[i], arg: arg});
                else
                  callbackLog.push({callback: listeners[i]});
              };
            }(listeners, i)));
          }

          // Attach listeners
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);
          emitter.on("y", listeners[0]);
          emitter.on("y", listeners[2]);

          // Run .fire("x") with "a"
          var a = function(){};
          emitter.fire("x", a);
          expect(callbackLog.length).toBe(2);
          expect(callbackLog[0]).toEqual({callback: listeners[0], arg: a});
          expect(callbackLog[1]).toEqual({callback: listeners[1], arg: a});

          // Clear callbackLog
          callbackLog.length = 0;

          // Run .fire("y")
          emitter.fire("y");
          expect(callbackLog.length).toBe(2);
          expect(callbackLog[0]).toEqual({callback: listeners[0]});
          expect(callbackLog[1]).toEqual({callback: listeners[2]});
        });

        it(".fire() does nothing when called on an unwatched event", function(){

          // Create an emitter
          var emitter = new LiveBlocks[name]();

          // Set up listeners
          var listeners = [], callbackLog = [];
          for (var i = 0; i < 3; i++){

            listeners.push((function(listeners, i){

              return function(arg){

                if (typeof arg !== "undefined")
                  callbackLog.push({callback: listeners[i], arg: arg});
                else
                  callbackLog.push({callback: listeners[i]});
              };
            }(listeners, i)));
          }

          // Attach listeners
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);
          emitter.on("y", listeners[0]);
          emitter.on("y", listeners[2]);

          // Run .fire("z")
          emitter.fire("z");
          expect(callbackLog.length).toBe(0);
        });

        it(".fire() calls each listener once, even if listeners are deregistered during .fire()", function(){

          // Create an emitter
          var emitter = new LiveBlocks[name]();

          // Set up listeners
          var listeners = [], callbackLog = [];
          for (var i = 0; i < 3; i++){

            listeners.push((function(listeners, i){

              return function(arg){

                if (typeof arg !== "undefined")
                  callbackLog.push({callback: listeners[i], arg: arg});
                else
                  callbackLog.push({callback: listeners[i]});

                // Deregister listeners[1]
                emitter.off("x", listeners[1]);
              };
            }(listeners, i)));
          }

          // Attach listeners
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);
          emitter.on("x", listeners[2]);

          // Run .fire("x", a)
          var a = function(){};
          emitter.fire("x", a);
          expect(callbackLog.length).toBe(3);
          expect(callbackLog[0]).toEqual({callback: listeners[0], arg: a});
          expect(callbackLog[1]).toEqual({callback: listeners[1], arg: a});
          expect(callbackLog[2]).toEqual({callback: listeners[2], arg: a});
          expect(emitter._listeners["x"].length).toBe(2);
        });

        it(".fire() ignores listeners registered during .fire()", function(){

          // Create an emitter
          var emitter = new LiveBlocks[name]();

          // Set up listeners
          var listeners = [], callbackLog = [];
          for (var i = 0; i < 3; i++){

            listeners.push((function(listeners, i){

              return function(arg){

                if (typeof arg !== "undefined")
                  callbackLog.push({callback: listeners[i], arg: arg});
                else
                  callbackLog.push({callback: listeners[i]});

                // Register listeners[2]
                emitter.on("x", listeners[2]);
              };
            }(listeners, i)));
          }

          // Attach listeners
          emitter.on("x", listeners[0]);
          emitter.on("x", listeners[1]);

          // Run .notify("x")
          emitter.fire("x");
          expect(callbackLog.length).toBe(2);
          expect(callbackLog[0]).toEqual({callback: listeners[0]});
          expect(callbackLog[1]).toEqual({callback: listeners[1]});
          expect(emitter._listeners["x"].length).toBe(3);
        });
      });
    }(classNames[i]));
  }
}(["EventEmitter", "Block", "WireConstraint", "Wire", "BlackBox"]));

