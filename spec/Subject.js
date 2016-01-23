"use strict";

(function(classNames){
  
  for (var i = 0; i < classNames.length; i++){

    (function(name){

      describe(name + " class", function(){

        var LiveBlocks = window.LiveBlocks;

        it("does not attach duplicate observers", function(){

          // Create a Subject
          var subject = new LiveBlocks[name]();
          expect(subject._observers).toEqual({});
          
          // Attach the first observer
          var observers = [{}, {}, {}];
          subject.attach(observers[0], "x");
          expect(subject._observers).toEqual({"x": [{}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);

          // Attach a new observer
          subject.attach(observers[1], "x");
          expect(subject._observers).toEqual({"x": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);
          expect(subject._observers["x"][1]).toBe(observers[1]);

          // Attach the same observer again
          subject.attach(observers[0], "x");
          expect(subject._observers).toEqual({"x": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);
          expect(subject._observers["x"][1]).toBe(observers[1]);

          // Attach two different observers to "y"
          subject.attach(observers[0], "y");
          subject.attach(observers[2], "y");
          expect(subject._observers).toEqual({"x": [{}, {}], "y": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);
          expect(subject._observers["x"][1]).toBe(observers[1]);
          expect(subject._observers["y"][0]).toBe(observers[0]);
          expect(subject._observers["y"][1]).toBe(observers[2]);
        });

        it("does not delete an observer list if any observers remain", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();
          expect(subject._observers).toEqual({});

          // Attach some observers
          var observers = [{}, {}, {}];
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");
          subject.attach(observers[0], "y");
          subject.attach(observers[2], "y");
          expect(subject._observers).toEqual({"x": [{}, {}], "y": [{}, {}]});

          // Detach first "x" observer
          subject.detach(observers[0], "x");
          expect(subject._observers).toEqual({"x": [{}], "y": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[1]);
        });

        it("deletes an observer list when the last observer is detached", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();
          expect(subject._observers).toEqual({});

          // Attach some observers
          var observers = [{}, {}, {}];
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");
          subject.attach(observers[0], "y");
          subject.attach(observers[2], "y");
          expect(subject._observers).toEqual({"x": [{}, {}], "y": [{}, {}]});

          // Detach all "x" observers
          subject.detach(observers[0], "x");
          subject.detach(observers[1], "x");
          expect(subject._observers).toEqual({"y": [{}, {}]});
        });

        it("does nothing when a non-existent observers is detached", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();
          expect(subject._observers).toEqual({});

          // Attach some observers
          var observers = [{}, {}, {}];
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");
          subject.attach(observers[0], "y");
          subject.attach(observers[2], "y");
          expect(subject._observers).toEqual({"x": [{}, {}], "y": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);
          expect(subject._observers["x"][1]).toBe(observers[1]);

          // Detach non-existent observer
          subject.detach(observers[2], "x");
          expect(subject._observers).toEqual({"x": [{}, {}], "y": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);
          expect(subject._observers["x"][1]).toBe(observers[1]);
        });

        it("does nothing when an observer is detached from a non-observed property", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();
          expect(subject._observers).toEqual({});

          // Attach some observers
          var observers = [{}, {}, {}];
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");
          expect(subject._observers).toEqual({"x": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);
          expect(subject._observers["x"][1]).toBe(observers[1]);

          // Detach from non-observed property
          subject.detach(observers[0], "y");
          expect(subject._observers).toEqual({"x": [{}, {}]});
          expect(subject._observers["x"][0]).toBe(observers[0]);
          expect(subject._observers["x"][1]).toBe(observers[1]);
        });

        it(".notify() function calls .update() once on each observer", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();

          // Set up observers
          var updateRecord = [];
          var updateFn = function(){
            updateRecord.push(this);
          };
          var observers = [{}, {}, {}];
          for (var i = 0; i < observers.length; i++)
            observers[i].update = updateFn;

          // Attach observers
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");
          subject.attach(observers[0], "y");
          subject.attach(observers[2], "y");

          // Run .notify("x")
          subject.notify("x");
          expect(updateRecord.length).toBe(2);
          expect(updateRecord[0]).toBe(observers[0]);
          expect(updateRecord[1]).toBe(observers[1]);

          // Clear updateRecord
          updateRecord.length = 0;

          // Run .notify("y")
          subject.notify("y");
          expect(updateRecord.length).toBe(2);
          expect(updateRecord[0]).toBe(observers[0]);
          expect(updateRecord[1]).toBe(observers[2]);
        });

        it(".notify() does nothing when called on a non-observed property", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();

          // Set up observers
          var updateRecord = [];
          var updateFn = function(){
            updateRecord.push(this);
          };
          var observers = [{}, {}, {}];
          for (var i = 0; i < observers.length; i++)
            observers[i].update = updateFn;

          // Attach observers
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");
          subject.attach(observers[0], "y");
          subject.attach(observers[2], "y");

          // Run .notify("z")
          subject.notify("z");
          expect(updateRecord.length).toBe(0);
        });

        it(".notify() calls update once on each observer, even if observers are detached during .notify()", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();

          // Set up observers
          var observers = [{}, {}, {}];
          var updateRecord = [];
          var updateFn = function(){
            updateRecord.push(this);
            subject.detach(observers[1], "x");
          };
          for (var i = 0; i < observers.length; i++)
            observers[i].update = updateFn;

          // Attach observers
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");
          subject.attach(observers[2], "x");

          // Run .notify("x")
          subject.notify("x");
          expect(updateRecord.length).toBe(3);
          expect(updateRecord[0]).toBe(observers[0]);
          expect(updateRecord[1]).toBe(observers[1]);
          expect(updateRecord[2]).toBe(observers[2]);
          expect(subject._observers["x"].length).toBe(2);
        });

        it(".notify() ignores observers attached during .notify()", function(){

          // Create a subject
          var subject = new LiveBlocks[name]();

          // Set up observers
          var observers = [{}, {}, {}];
          var updateRecord = [];
          var updateFn = function(){
            updateRecord.push(this);
            subject.attach(observers[2], "x");
          };
          for (var i = 0; i < observers.length; i++)
            observers[i].update = updateFn;

          // Attach observers
          subject.attach(observers[0], "x");
          subject.attach(observers[1], "x");

          // Run .notify("x")
          subject.notify("x");
          expect(updateRecord.length).toBe(2);
          expect(updateRecord[0]).toBe(observers[0]);
          expect(updateRecord[1]).toBe(observers[1]);
          expect(subject._observers["x"].length).toBe(3);
        });
      });
    }(classNames[i]));
  }
}(["Subject", "Block"]));

