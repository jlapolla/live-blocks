  }.call(inner, host));

  // Expose only public classes and functions on LiveBlocks module
  (function(inner, arr){

    for (var i = 0; i < arr.length; i++)
      this[arr[i]] = inner[arr[i]];
  }.call(this, inner, ["BlackBox", "Wire", "WireConstraint"]));
}.call(this.LiveBlocks, this));

