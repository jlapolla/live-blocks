this.multiInheritClass = function(base, derived) {

  // Fake multiple inheritance
  for (var name in base.prototype) {

    if (name !== 'constructor') {

      derived.prototype[name] = base.prototype[name];
    }
  }
};

