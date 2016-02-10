"use strict"

const Rx = require("@reactivex/rxjs")

describe("windowTime with Lolex", function() {
  it.marble("cold observable", function() {
    const events = {
      b: [],
      c: ["a"],
    }

    const inputStream  = cold("------a-------|")
    const timespan     = time("----|");
    //                             ----|
    //                                 ----|
    //                                     ----|
    const expected     =      "----b---c---b-(b|)"

    const testStream   = inputStream.windowTime(timespan).map((v) => v.toArray()).mergeAll()

    return expectObservable(testStream).toBe(expected, events)
  })

  it.marble("hot observable", function() {
    const events = {
      b: [],
      c: ["a"],
    }

    const inputStream  =  hot("-a-^-----a-------|")
    const timespan     =    time("----|")
    //                                ----|
    //                                    ----|
    //                                        ----|
    const expected     =         "----b---c---b-(b|)"

    const testStream   = inputStream.windowTime(timespan).map((v) => v.toArray()).mergeAll()

    return expectObservable(testStream).toBe(expected, events)
  })

  it.marble("multiple observables", function() {
    const events = {
      b: [],
      c: ["a"],
      d: ["a", "a"],
    }

    const inputStream  = cold("-a-------a-------|")
    const inputStream2 = cold("-a-------a-------|")
    const timespan     = time("----|")
    //                             ----|
    //                                 ----|
    //                                     ----|
    const expected     =      "----d---b---d---b(b|)"

    const testStream   = inputStream.merge(inputStream2).windowTime(timespan).map((v) => v.toArray()).mergeAll()

    return expectObservable(testStream).toBe(expected, events)
  })
})

