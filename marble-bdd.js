// This is an extension of mocha/lib/interfaces/bdd.js.
//
// Like https://github.com/tauren/mocha-wav, I have not found a way to reuse/extend 
// the bdd.js, hence its just copied and modified.
//
// The extensions are marked with MARBLE and BEGIN_MARBLE/END_MARBLE.
//

var Mocha    = require('mocha');
var Suite    = require('mocha/lib/suite');
var Test     = require('mocha/lib/test');
var escapeRe = require('escape-string-regexp');
var chai     = require("chai")
var Rx       = require("rxjs")


// When running marble tests it is not possible to use regular chai assertions because
// the marble test framework executes only after the entire test it body has been executed.
// So where we hack in a way to add additional assertions to run after the marble bit.
// Maybe some better syntax could be used.
//
// export type valueToBeFn = (expected: any) => void;
function expectValue(actual) {
  const flushTest = {actual, ready: false}
  this.flushTests.push(flushTest)
  return ({
    toBe(expected) {
      flushTest.ready = true
      flushTest.expected = expected
    }
  })
}

module.exports = Mocha.interfaces['marble-bdd'] = function(suite) {
  var suites = [suite];
  
  global.rxTestScheduler = null //MARBLE

  suite.on('pre-require', function(context, file, mocha) {
    var common = require('mocha/lib/interfaces/common')(suites, context);

    context.before = common.before;
    context.after = common.after;
    context.beforeEach = common.beforeEach;
    context.afterEach = common.afterEach;
    context.run = mocha.options.delay && common.runWithSuite(suite);
    
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */

    context.describe = context.context = function(title, fn) {
      var suite = Suite.create(suites[0], title);
      suite.file = file;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
      return suite;
    };

    /**
     * Pending describe.
     */

    context.xdescribe = context.xcontext = context.describe.skip = function(title, fn) {
      var suite = Suite.create(suites[0], title);
      suite.pending = true;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
    };

    /**
     * Exclusive suite.
     */

    context.describe.only = function(title, fn) {
      var suite = context.describe(title, fn);
      mocha.grep(suite.fullTitle());
      return suite;
    };

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */

    context.it = context.specify = function(title, fn) {
      var suite = suites[0];
      if (suite.pending) {
        fn = null;
      }
      var test = new Test(title, fn);
      test.file = file;
      suite.addTest(test);
      return test;
    };

    /**
     * Exclusive test-case.
     */

    context.it.only = function(title, fn) {
      var test = context.it(title, fn);
      var reString = '^' + escapeRe(test.fullTitle()) + '$';
      mocha.grep(new RegExp(reString));
      return test;
    };

    /**
     * Pending test case.
     */

    context.xit = context.xspecify = context.it.skip = function(title) {
      context.it(title);
    };
    
    //BEGIN_MARBLE ----------------------------------------------------------------------------------

    context.hot = function () {
      if (!global.rxTestScheduler) {
        throw 'tried to use hot() in non marble test'
      }
      return global.rxTestScheduler.createHotObservable.apply(global.rxTestScheduler, arguments)
    }
    
    context.cold = function () {
      if (!global.rxTestScheduler) {
        throw 'tried to use cold() in non marble test'
      }
      return global.rxTestScheduler.createColdObservable.apply(global.rxTestScheduler, arguments)
    }
    
    context.time = function  () {
      if (!global.rxTestScheduler) {
        throw 'tried to use time() in non marble test'
      }
      return global.rxTestScheduler.createTime.apply(global.rxTestScheduler, arguments)
    }
    
    context.expectObservable = function () {
      if (!global.rxTestScheduler) {
        throw 'tried to use expectObservable() in non marble test'
      }
      return global.rxTestScheduler.expectObservable.apply(global.rxTestScheduler, arguments)
    }
    
    context.expectSubscriptions = function () {
      if (!global.rxTestScheduler) {
        throw 'tried to use expectSubscriptions() in non marble test'
      }
      return global.rxTestScheduler.expectSubscriptions.apply(global.rxTestScheduler, arguments)
    }

    context.expectValue = function () {
      if (!global.rxTestScheduler) {
        throw 'tried to use expectValue() in non marble test'
      }
      return global.rxTestScheduler.expectValue.apply(global.rxTestScheduler, arguments)
    }

    function assertDeepEqual(actual, expected) {
      chai.expect(actual).to.deep.equal(expected);
    }

    context.it.marble = function (description, cb) {
      if (cb.length > 0) {
        throw new Error("marble tests must be sync")
      }
      try {
        context.it(description, function () {
          global.rxTestScheduler = new Rx.TestScheduler(assertDeepEqual)
          global.rxTestScheduler.expectValue = expectValue
          cb(this)
          global.rxTestScheduler.flush()
        })
      } catch (err) {
        console.log(">>> err=", err)
      } finally {
        global.rxTestScheduler = null
      }
    }

    context.it.marble.only = function(description, cb) {
      if (cb.length > 0) {
        throw new Error("marble tests must be sync")
      }
      try {
        context.it.only(description, function () {
          global.rxTestScheduler = new Rx.TestScheduler(assertDeepEqual)
          global.rxTestScheduler.expectValue = expectValue
          cb(this)
          global.rxTestScheduler.flush()
        })
      } catch (err) {
        console.log("Marble test ERROR: ", err)
      } finally {
        global.rxTestScheduler = null
      }
    }
    
    context.it.marble.skip = context.it.skip
    
    //context.it.marble.asDiagram = function () {
    //  return contex.it.marble
    //}

    // This seems to be used by the diagram-test-runner. Not sure why its not defined there.
    //;(function () {
    //  Object.defineProperty(Error.prototype, 'toJSON', {
    //    value: function () {
    //      var alt = {}
    //
    //      Object.getOwnPropertyNames(this).forEach(function (key) {
    //        if (key !== 'stack') {
    //          alt[key] = this[key]
    //        }
    //      }, this)
    //      return alt
    //    },
    //    configurable: true
    //  })
    //
    //  global.__root__ = root
    //})()
    
    //END_MARBLE --------------------------------------------------------------------------------------
  })
  
}
