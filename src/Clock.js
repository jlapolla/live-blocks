this.Clock = (function(Set,
  EventEmitter,
  extendClass) {

  function Clock() {

    EventEmitter.call(this);

    this._bindings = new Set();
  }

  extendClass(EventEmitter, Clock);
  var P = Clock.prototype;
  P.tick = function() {

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

    // Fire event
    this.fire('tick');
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
}(this.Set,
 this.EventEmitter,
 this.extendClass));

