'use strict';

describe('extendClass function', function() {

  var LiveBlocks = window.LiveBlocks;

  // Skip test if extendClass is not exposed
  if (!LiveBlocks.extendClass)
    return;

  it('extends a class', function() {

    // Make Mover class
    function Mover() {
      this._myMove = 'I\'m a mover';
    }

    Mover.prototype = {};
    Mover.prototype.move = function() {
      return this._myMove;
    };

    // Make Walker class
    function Walker() {
      Mover.call(this);
      this._myWalk = 'I walk the walk';
    }

    LiveBlocks.extendClass(Mover, Walker);
    Walker.prototype.walk = function() {
      return this._myWalk;
    };

    // Instatiate Walker
    var object = new Walker();

    // Check inheritance with instanceof
    expect(object instanceof Walker).toBe(true);
    expect(object instanceof Mover).toBe(true);

    // Check functions
    expect(object.walk()).toBe('I walk the walk');
    expect(object.move()).toBe('I\'m a mover');
  });
});

