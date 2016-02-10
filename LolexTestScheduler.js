var Rx = require("@reactivex/rxjs")
var LolexTestScheduler = Rx.TestScheduler;

// updated flush function, this is defined in VirtualTimeScheduler. (which was called in the TestScheduler)
var flush = function () {
  var actions = this.actions;
  var maxFrames = this.maxFrames;
  while (actions.length > 0) {
    var action = actions.shift();

    var last = action.delay - (new Date()).getTime();
    if (last === 0) {
      this.frame = action.delay;
      global.clock.tick(LolexTestScheduler.frameTimeFactor)
    } else {
      for(var i = 0; i <= last; i = i + LolexTestScheduler.frameTimeFactor) {
        this.frame += LolexTestScheduler.frameTimeFactor;
        global.clock.tick(LolexTestScheduler.frameTimeFactor)
      }
    }

    if (this.frame <= maxFrames) {
      action.execute();
    }
    else {
      break;
    }
  }
  actions.length = 0;
  this.frame = 0;
}

LolexTestScheduler.prototype.flush = function () {
  var hotObservables = this.hotObservables;
  while (hotObservables.length > 0) {
    hotObservables.shift().setup();
  }
  flush.call(this);
  var readyFlushTests = this.flushTests.filter(function (test) { return test.ready; });
  while (readyFlushTests.length > 0) {
    var test = readyFlushTests.shift();
    this.assertDeepEqual(test.actual, test.expected);
  }
};

module.exports = LolexTestScheduler;
