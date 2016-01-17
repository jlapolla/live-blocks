"use strict";

describe("Subject class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("does not attach duplicate observers", function(){

    var subject = new LiveBlocks.Subject();

    expect(subject._observers).toEqual({});
    
    var observers = [{}, {}, {}];
    subject.attach(observers[0], "x");

    expect(subject._observers).toEqual({"x": [{}]});
    expect(subject._observers["x"][0]).toBe(observers[0]);
  });
});
