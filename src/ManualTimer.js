this.ManualTimer = (function(Set) {

  function ManualTimer() {

    this._set = new Set();
  };

  ManualTimer.prototype = {};
  var P = ManualTimer.prototype;
  P.tickTock = function() {

    // Get iterator over scheduled items
    var it = this._set.values();

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
}(this.Set));

