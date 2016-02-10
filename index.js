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

var MarbleInterface = require("./mocha-marble-bdd")

module.exports = MarbleInterface
