this.Map = (function(){
  var same = function(a, b){

    return a !== a ? b !== b : a === b;
  };
  function Map(){

    this._array = [];
  }
  Map.prototype = {};
  var P = Map.prototype;
  P.get = function(key){

    // Get value at key
    var array = this._array;
    for (var i = 0; i < array.length; i++){

      if (same(array[i].key, key))
        return array[i].value;
    }
  };
  P.put = function(key, value){

    // Copy entries to new array, except entry with matching key
    var array = this._array, newArray = [];
    for (var i = 0; i < array.length; i++){

      if (!same(array[i].key, key))
        newArray.push(array[i]);
    }

    // Add new entry to new array
    newArray.push({key: key, value: value});

    // Set private array to new array
    this._array = newArray;
  };
  P.remove = function(key){

    // Copy entries to new array, except entry with matching key
    var array = this._array, newArray = [];
    for (var i = 0; i < array.length; i++){

      if (!same(array[i].key, key))
        newArray.push(array[i]);
    }

    // Set private array to new array
    this._array = newArray;
  };
  P.has = function(key){

    // Search for matching key
    var array = this._array;
    for (var i = 0; i < array.length; i++){

      if (same(array[i].key, key))
        return true;
    }

    // Match not found
    return false;
  };
  return Map;
}());

