// This is an extension of mocha/lib/interfaces/bdd.js.
//
// Like https://github.com/tauren/mocha-wav, I have not found a way to reuse/extend
// the bdd.js, hence its just copied and modified.
//
// The extensions are marked with MARBLE and BEGIN_MARBLE/END_MARBLE.
//

const MarbleInterface = require("./src/marble-bdd")

module.exports = MarbleInterface
