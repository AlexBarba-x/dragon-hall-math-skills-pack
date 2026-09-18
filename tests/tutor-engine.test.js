"use strict";

var assert = require("assert");
var E = require("../js/tutor-engine.js");

function check(name, fn) {
  try {
    fn();
    console.log("ok  " + name);
  } catch (err) {
    console.error("FAIL  " + name);
    console.error("  " + err.message);
    process.exitCode = 1;
  }
}

check("gcd and simplify", function () {
  assert.strictEqual(E.gcd(12, 18), 6);
  assert.deepStrictEqual(E.simplify(-6, -8), { n: 3, d: 4 });
  assert.deepStrictEqual(E.simplify(-3, 6), { n: -1, d: 2 });
});

check("mixed to improper keeps the minus on the whole value", function () {
  assert.deepStrictEqual(E.mixedToImproper(-1, 2, 1, 3), { n: -7, d: 3 });
  assert.deepStrictEqual(E.mixedToImproper(1, 1, 5, 6), { n: 11, d: 6 });
});

check("signed mixed add matches the worked Commons-shape example with new numbers", function () {
  var ans = E.addSignedMixed(
    { sign: -1, whole: 2, num: 1, den: 3 },
    { sign: 1, whole: 1, num: 5, den: 6 }
  );
  assert.deepStrictEqual(ans, { n: -1, d: 2 });
});

check("parseNumberLoose accepts mix, fraction, and decimal", function () {
  assert.ok(E.fractionsEqual(E.parseNumberLoose("-5/8"), { n: -5, d: 8 }));
  assert.ok(E.fractionsEqual(E.parseNumberLoose("1 1/10"), { n: 11, d: 10 }));
  assert.ok(E.fractionsEqual(E.parseNumberLoose("-1 1/6"), { n: -7, d: 6 }));
  assert.ok(E.fractionsEqual(E.parseNumberLoose("-0.5"), { n: -1, d: 2 }));
});

check("mix grader: correct, almost (dropped sign), try again", function () {
  var item = E.makeMixItem(E.makeRng(42));
  var good = E.formatMixedFromND(item.ans.n, item.ans.d).replace("−", "-");
  assert.strictEqual(item.grade(good).result, "correct");
  assert.strictEqual(item.grade(E.formatFrac(item.ans.n, item.ans.d)).result, "correct");
  var flipped = E.formatFrac(-item.ans.n, item.ans.d);
  assert.strictEqual(item.grade(flipped).result, "almost");
  assert.strictEqual(item.grade("999").result, "try");
  assert.strictEqual(item.grade("").result, "empty");
});

check("mix hints reveal one scaffold, not the final-only answer on first tap", function () {
  var item = E.makeMixItem(E.makeRng(7));
  var h0 = E.hintText(item, 0);
  var simple = E.formatMixedFromND(item.ans.n, item.ans.d);
  assert.ok(item.hints.length >= 3);
  assert.ok(h0.indexOf("fraction") !== -1 || h0.indexOf("mix") !== -1);
  assert.ok(h0.indexOf(simple) === -1);
});

check("ineq compare uses a unique strict sign", function () {
  var found = null;
  for (var seed = 1; seed < 80 && !found; seed++) {
    var item = E.makeIneqItem(E.makeRng(seed));
    if (item.type === "compare") found = item;
  }
  assert.ok(found, "expected a compare item");
  assert.strictEqual(found.grade(found.accept[0]).result, "correct");
  assert.strictEqual(found.grade(found.almost[0]).result, "almost");
  var other = found.accept[0] === "<" ? ">" : "<";
  assert.strictEqual(found.grade(other).result, "try");
});

check("ineq words: at most vs less than is almost, not correct", function () {
  var found = null;
  for (var seed = 1; seed < 200 && !found; seed++) {
    var item = E.makeIneqItem(E.makeRng(seed));
    if (item.type === "words" && item.almostMsg && item.almostMsg.indexOf("At most") !== -1) found = item;
  }
  assert.ok(found, "expected an at-most words item");
  assert.strictEqual(found.grade(found.accept[0]).result, "correct");
  assert.strictEqual(found.grade(found.almost[0]).result, "almost");
});

check("exponent product adds, power multiplies", function () {
  var product, power, zero;
  for (var seed = 1; seed < 200; seed++) {
    var item = E.makeExpItem(E.makeRng(seed));
    if (item.type === "product" && !product) product = item;
    if (item.type === "power" && !power) power = item;
    if (item.type === "zero-mix" && !zero) zero = item;
  }
  assert.ok(product && power && zero);
  assert.strictEqual(product.grade(product.nice).result, "correct");
  assert.strictEqual(product.grade(product.almost[0]).result, "almost");
  assert.strictEqual(power.grade(power.nice).result, "correct");
  assert.strictEqual(power.grade(power.almost[0]).result, "almost");
  assert.strictEqual(zero.grade("0").result, "almost");
});

check("pay forward and reverse use integer dollars", function () {
  var fwd, rev, baseQ;
  for (var seed = 1; seed < 200; seed++) {
    var item = E.makePayItem(E.makeRng(seed));
    if (item.type === "forward" && !fwd) fwd = item;
    if (item.type === "reverse" && !rev) rev = item;
    if (item.type === "base" && !baseQ) baseQ = item;
  }
  assert.ok(fwd && rev && baseQ);
  assert.strictEqual(fwd.grade(String(fwd.ans)).result, "correct");
  assert.ok(fwd.almostNums.length >= 1);
  assert.strictEqual(fwd.grade(String(fwd.almostNums[0].n)).result, "almost");
  assert.strictEqual(rev.grade(String(rev.ans)).result, "correct");
  assert.strictEqual(baseQ.grade("sales").result, "correct");
  assert.strictEqual(baseQ.grade("basepay").result, "almost");
});

check("progress unlocks the next mission only after a streak of 4", function () {
  var mem = {
    store: {},
    getItem: function (k) {
      return this.store[k] || null;
    },
    setItem: function (k, v) {
      this.store[k] = v;
    }
  };
  var p = E.loadProgress(mem);
  assert.strictEqual(E.isUnlocked(p, "mix"), true);
  assert.strictEqual(E.isUnlocked(p, "ineq"), false);
  E.applyGrade(p, "mix", "correct");
  E.applyGrade(p, "mix", "correct");
  E.applyGrade(p, "mix", "try");
  E.applyGrade(p, "mix", "correct");
  E.applyGrade(p, "mix", "correct");
  E.applyGrade(p, "mix", "correct");
  assert.strictEqual(p.missions.mix.mastered, false);
  E.applyGrade(p, "mix", "correct");
  assert.strictEqual(p.missions.mix.mastered, true);
  assert.ok(p.missions.mix.stars >= 4);
  assert.strictEqual(E.isUnlocked(p, "ineq"), true);
  assert.strictEqual(E.isUnlocked(p, "exp"), false);
  E.saveProgress(p, mem);
  var reloaded = E.loadProgress(mem);
  assert.strictEqual(reloaded.missions.mix.mastered, true);
});

check("next mission order", function () {
  assert.strictEqual(E.nextMissionId("mix"), "ineq");
  assert.strictEqual(E.nextMissionId("ineq"), "exp");
  assert.strictEqual(E.nextMissionId("exp"), "pay");
  assert.strictEqual(E.nextMissionId("pay"), null);
});

check("generated mix items stay original-isomorphic and bounded", function () {
  for (var seed = 1; seed <= 40; seed++) {
    var item = E.makeMixItem(E.makeRng(seed));
    assert.ok(item.d1 !== item.d2, "unlike parts");
    assert.ok(item.ans.d > 0);
    assert.ok(Math.abs(item.ans.n) < 80);
    assert.ok(item.hints.length === 4);
    assert.ok(item.modelHtml.indexOf("steps") !== -1);
  }
});

if (process.exitCode) {
  console.error("\nSome engine tests failed.");
  process.exit(1);
}
console.log("\nAll engine tests passed.");
