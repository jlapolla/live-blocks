this.Clock = (function(Set) {

  function Clock() {

    this._bindings = new Set();
  }

  Clock.prototype = {};
  var P = Clock.prototype;
  P.duplicate = function() {

    return new Clock();
  };

  P.tickTock = function() {

    // Get iterator over blocks
    var it = this._bindings.values();

    // Call tick() on all blocks
    while (!it.peek().done) {

      it.next().value.tick();
    }

    // Call tock() on all blocks
    it.reset();
    while (!it.peek().done) {

      it.next().value.tock();
    }
  };

  P.bind = function(block) {

    this._bindings.add(block);
  };

  P.unbind = function(block) {

    this._bindings.remove(block);
  };

  P.blocks = function() {

    // Return iterator over blocks
    return this._bindings.values();
  };

  return Clock;
}(this.Set));

