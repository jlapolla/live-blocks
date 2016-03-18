this.ManualTimer = (function(Set,
  EventEmitter,
  extendClass) {

  function ManualTimer() {

    EventEmitter.call(this);

    this._set = new Set();
  };

  extendClass(EventEmitter, ManualTimer);
  var P = ManualTimer.prototype;
  P.tick = function() {

    // Get iterator over scheduled items
    var it = this._set.values();

    if (!it.peek().done) {

      // Get a new set
      this._set = new Set();

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
    }
  };

  P.schedule = function(block) {

    this._set.add(block);
  };

  P.cancel = function(block) {

    if (arguments.length) {

      // We are cancelling a single block
      this._set.remove(block);
    }
    else {

      // We are cancelling all blocks
      this._set = new Set();
    }
  };

  return ManualTimer;
}(this.Set,
  this.EventEmitter,
  this.extendClass));

