this.maxIterations = (function() {

  var maxIterations = 100;
  return function(iterations) {

    if (arguments.length) {

      // We are setting max iterations
      maxIterations = iterations;
    }
    else {

      // We are getting max iterations
      return maxIterations;
    }
  };
}());

