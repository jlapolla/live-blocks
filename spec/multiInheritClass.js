"use strict";

describe("multiInheritClass function", function(){

  var LiveBlocks = window.LiveBlocks;

  it("fakes multiple inheritance in Javascript", function(){

    // Make Walker class
    function Walker(){
      this._myWalk = "I walk the walk";
    }
    Walker.prototype = {};
    Walker.prototype.walk = function(){
      return this._myWalk;
    };

    // Make Talker class
    function Talker(){
      this._myTalk = "I talk the talk";
    }
    Talker.prototype = {};
    Talker.prototype.talk = function(){
      return this._myTalk;
    };

    // Make WalkerAndTalker class
    function WalkerAndTalker(){
      Walker.call(this);
      Talker.call(this);
    }
    LiveBlocks.extendClass(Walker, WalkerAndTalker);
    LiveBlocks.multiInheritClass(Talker, WalkerAndTalker);
    WalkerAndTalker.prototype.walkAndTalk = function(){
      return this.walk() + " and " + this.talk();
    };

    // Instantiate WalkerAndTalker
    var object = new WalkerAndTalker();

    // Check inheritance with instanceof
    expect(object instanceof WalkerAndTalker).toBe(true);
    expect(object instanceof Walker).toBe(true);
    expect(object instanceof Talker).toBe(false); // Javascript doesn't support multiple inheritance

    // Check functions
    expect(object.walkAndTalk()).toBe("I walk the walk and I talk the talk");
    expect(object.walk()).toBe("I walk the walk");
    expect(object.talk()).toBe("I talk the talk");
  });

  xit("does not overwrite the constructor", function(){});
});

