  }.call(inner, host));

  // Expose only public classes and functions on LiveBlocks module
  var expose = [
    'AsyncTimer',
    'BlackBox',
    'Clock',
    'ClockedBlock',
    'ImmediateBlock',
    'IntervalTimer',
    'ManualTimer',
    'TimedBlock',
    'Wire',
  ];
  (function(inner, arr) {

    for (var i = 0; i < arr.length; i++) {

      this[arr[i]] = inner[arr[i]];
    }
  }.call(this, inner, expose));
}.call(this.LiveBlocks, this));

