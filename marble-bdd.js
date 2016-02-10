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
var Rx       = require("@reactivex/rxjs")
var lolex    = require("lolex")
var LolexTestScheduler = require("./LolexTestScheduler")

module.exports = Mocha.interfaces['marble-bdd'] = function(suite) {
  var suites = [suite];
  
  global.rxLolexTestScheduler = null //MARBLE
  global.clock = null //MARBLE

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
      if (!global.rxLolexTestScheduler) {
        throw 'tried to use hot() in non marble test'
      }
      return global.rxLolexTestScheduler.createHotObservable.apply(global.rxLolexTestScheduler, arguments)
    }
    
    context.cold = function () {
      if (!global.rxLolexTestScheduler) {
        throw 'tried to use cold() in non marble test'
      }
      return global.rxLolexTestScheduler.createColdObservable.apply(global.rxLolexTestScheduler, arguments)
    }
    
    context.time = function  () {
      if (!global.rxLolexTestScheduler) {
        throw 'tried to use time() in non marble test'
      }
      return global.rxLolexTestScheduler.createTime.apply(global.rxLolexTestScheduler, arguments)
    }
    
    context.expectObservable = function () {
      if (!global.rxLolexTestScheduler) {
        throw 'tried to use expectObservable() in non marble test'
      }
      return global.rxLolexTestScheduler.expectObservable.apply(global.rxLolexTestScheduler, arguments)
    }
    
    context.expectSubscriptions = function () {
      if (!global.rxLolexTestScheduler) {
        throw 'tried to use expectSubscriptions() in non marble test'
      }
      return global.rxLolexTestScheduler.expectSubscriptions.apply(global.rxLolexTestScheduler, arguments)
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
          global.rxLolexTestScheduler = new LolexTestScheduler(assertDeepEqual)
          global.clock = lolex.install()
          cb(this)
          global.rxLolexTestScheduler.flush()
          global.clock.uninstall()
        })
      } catch (err) {
        console.log(">>> err=", err)
      } finally {
        global.rxLolexTestScheduler = null
        global.clock = null
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


