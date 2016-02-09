this.Set = (function(){
  var SetIterator = (function(){
    var refresh = function(){

      this._array = this._set._array;
    };
    function SetIterator(set){

      this._set = set;
      this._index = 0;
      refresh.call(this);
    }
    SetIterator.prototype = {};
    var P = SetIterator.prototype;
    P.reset = function(){

      // Reset iterator index
      this._index = 0;
    };
    P.next = function(){

      // Check if we are at the end of the iterator
      if (this._index < this._array.length){

        // Get current value
        var value = this._array[this._index];

        // Increment index and return value
        this._index = this._index + 1;
        return {
          done: false,
          value: value
        };
      }
      else
        return {done: true};
    };
    P.peek = function(){

      // Check if we are at the end of the iterator
      if (this._index < this._array.length){

        // Get current value
        var value = this._array[this._index];

        // Return value
        return {
          done: false,
          value: value
        };
      }
      else
        return {done: true};
    };
    return SetIterator;
  }());
  var same = function(a, b){

    return a !== a ? b !== b : a === b;
  };
  function Set(){

    this._array = [];
  }
  Set.prototype = {};
  var P = Set.prototype;
  P.add = function(value){

    // Copy entries to new array, except entry with same value
    var array = this._array, newArray = [];
    for (var i = 0; i < array.length; i++){

      if (!same(array[i], value))
        newArray.push(array[i]);
    }

    // Add new entry to new array
    newArray.push(value);

    // Set private array to new array
    this._array = newArray;
  };
  P.remove = function(value){

    // Copy entries to new array, except entry with same value
    var array = this._array, newArray = [];
    for (var i = 0; i < array.length; i++){

      if (!same(array[i], value))
        newArray.push(array[i]);
    }

    // Set private array to new array
    this._array = newArray;
  };
  P.has = function(value){

    // Search for same value
    var array = this._array;
    for (var i = 0; i < array.length; i++){

      if (same(array[i], value))
        return true;
    }

    // Match not found
    return false;
  };
  P.values = function(){

    return new SetIterator(this);
  };
  return Set;
}());

