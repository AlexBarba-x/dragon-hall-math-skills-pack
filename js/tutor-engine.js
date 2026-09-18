/**
 * Dragon Hall kid-solo tutor — math engine.
 * Browser: window.DHEngine
 * Node tests: module.exports
 */
(function (root, factory) {
  var engine = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = engine;
  }
  root.DHEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MISSIONS = [
    { id: "mix", title: "Mix & Minus", kid: "Add mix numbers. Some have a minus.", icon: "1" },
    { id: "ineq", title: "Divide & Compare", kid: "Divide, then pick a compare sign.", icon: "2" },
    { id: "exp", title: "Power Moves", kid: "Multiply, divide, and stack powers.", icon: "3" },
    { id: "pay", title: "Pay Day", kid: "Base pay plus a percent of sales.", icon: "4" }
  ];

  var STORAGE_KEY = "dragon-hall-tutor-v1";
  var MASTERY_STREAK = 4;
  var HINT_AFTER_WRONG = 2;

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (!a) return b || 1;
    if (!b) return a;
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  function lcm(a, b) {
    return Math.abs(a / gcd(a, b) * b);
  }

  function simplify(n, d) {
    if (d === 0) return { n: n, d: 0 };
    if (d < 0) {
      n = -n;
      d = -d;
    }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function fractionsEqual(a, b) {
    if (!a || !b || !a.d || !b.d) return false;
    return a.n * b.d === b.n * a.d;
  }

  function mixedToImproper(sign, whole, num, den) {
    var s = sign < 0 ? -1 : 1;
    whole = Math.abs(whole);
    num = Math.abs(num);
    den = Math.abs(den);
    return simplify(s * (whole * den + num), den);
  }

  function toMixed(n, d) {
    var s = n < 0 ? -1 : 1;
    var frac = simplify(Math.abs(n), Math.abs(d));
    var whole = Math.floor(frac.n / frac.d);
    var rem = frac.n % frac.d;
    return { sign: s, whole: whole, num: rem, den: frac.d };
  }

  function formatFrac(n, d) {
    var f = simplify(n, d);
    if (f.d === 1) return String(f.n);
    return f.n + "/" + f.d;
  }

  function formatMixedFromND(n, d) {
    var m = toMixed(n, d);
    var sign = m.sign < 0 ? "−" : "";
    if (m.num === 0) return sign + String(m.whole);
    if (m.whole === 0) return sign + m.num + "/" + m.den;
    return sign + m.whole + " " + m.num + "/" + m.den;
  }

  function htmlFrac(n, d, keep) {
    var f = keep ? { n: n, d: d < 0 ? -d : d } : simplify(n, d);
    if (keep && d < 0) f.n = -n;
    var sign = f.n < 0 ? "−" : "";
    var an = Math.abs(f.n);
    if (f.d === 1) return '<span class="mn">' + sign + an + "</span>";
    return (
      '<span class="mn">' +
      sign +
      '<span class="frac" aria-label="' +
      sign +
      an +
      " over " +
      f.d +
      '"><span>' +
      an +
      "</span><span>" +
      f.d +
      "</span></span></span>"
    );
  }

  function htmlMixed(n, d) {
    var m = toMixed(n, d);
    var sign = m.sign < 0 ? "−" : "";
    if (m.num === 0) return '<span class="mn">' + sign + m.whole + "</span>";
    var frac =
      '<span class="frac" aria-label="' +
      m.num +
      " over " +
      m.den +
      '"><span>' +
      m.num +
      "</span><span>" +
      m.den +
      "</span></span>";
    if (m.whole === 0) return '<span class="mn">' + sign + frac + "</span>";
    return '<span class="mn">' + sign + m.whole + "&nbsp;" + frac + "</span>";
  }

  function makeRng(seed) {
    var a = (Math.imul(seed, 0x9e3779b9) ^ 0x85ebca6b) >>> 0;
    if (!a) a = 1;
    return function rand() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, rand) {
    return list[Math.floor(rand() * list.length)];
  }

  function parseNumberLoose(raw) {
    var s = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/,/g, "")
      .replace(/\$/g, "")
      .replace(/−/g, "-")
      .replace(/–/g, "-")
      .replace(/\s+/g, " ");
    if (!s) return null;
    var mixed = s.match(/^(-)?(\d+)(?:\s+|_)(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      var signM = mixed[1] ? -1 : 1;
      return mixedToImproper(signM, parseInt(mixed[2], 10), parseInt(mixed[3], 10), parseInt(mixed[4], 10));
    }
    s = s.replace(/\s+/g, "");
    if (/^-?\d+$/.test(s)) return { n: parseInt(s, 10), d: 1 };
    var frac = s.match(/^(-)?(\d+)\/(\d+)$/);
    if (frac) {
      var n = parseInt(frac[2], 10);
      var d = parseInt(frac[3], 10);
      if (!d) return null;
      return simplify(frac[1] ? -n : n, d);
    }
    if (/^-?\d*\.\d+$/.test(s) || /^-?\d+\.\d*$/.test(s)) {
      var dec = Number(s);
      if (!isFinite(dec)) return null;
      var places = (s.split(".")[1] || "").length;
      var den = Math.pow(10, places);
      return simplify(Math.round(dec * den), den);
    }
    return null;
  }

  function parseIneqText(raw) {
    var s = String(raw || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/÷/g, "/")
      .replace(/·/g, "*");
    return s;
  }

  function addSignedMixed(left, right) {
    var L = mixedToImproper(left.sign, left.whole, left.num, left.den);
    var R = mixedToImproper(right.sign, right.whole, right.num, right.den);
    var D = lcm(L.d, R.d);
    return simplify(L.n * (D / L.d) + R.n * (D / R.d), D);
  }

  function mixHints(item) {
    var L = mixedToImproper(-1, item.w1, item.n1, item.d1);
    var R = mixedToImproper(1, item.w2, item.n2, item.d2);
    var D = lcm(L.d, R.d);
    var Ln = L.n * (D / L.d);
    var Rn = R.n * (D / R.d);
    return [
      "Turn each mix into one fraction. −" +
        item.w1 +
        " " +
        item.n1 +
        "/" +
        item.d1 +
        " = " +
        formatFrac(L.n, L.d) +
        ".",
      "Give both the same bottom number. Use " + D + ".",
      "Add the tops: " + Ln + " + " + Rn + " = " + (Ln + Rn) + ". Keep " + D + " on the bottom.",
      "Make it simple if you can. Divide top and bottom by the same number."
    ];
  }

  function mixModel(item) {
    var L = mixedToImproper(-1, item.w1, item.n1, item.d1);
    var R = mixedToImproper(1, item.w2, item.n2, item.d2);
    var D = lcm(L.d, R.d);
    var Ln = L.n * (D / L.d);
    var Rn = R.n * (D / R.d);
    var sum = simplify(Ln + Rn, D);
    return (
      "<ol class='steps'>" +
      "<li>One fraction each: " +
      htmlFrac(L.n, L.d) +
      " + " +
      htmlFrac(R.n, R.d) +
      ".</li>" +
      "<li>Same bottom (" +
      D +
      "): " +
      htmlFrac(Ln, D, true) +
      " + " +
      htmlFrac(Rn, D, true) +
      ".</li>" +
      "<li>Add tops: " +
      htmlFrac(sum.n, sum.d) +
      ".</li>" +
      "<li>Simple form: " +
      htmlMixed(sum.n, sum.d) +
      ".</li>" +
      "</ol>"
    );
  }

  function gradeMix(item, raw) {
    var got = parseNumberLoose(raw);
    if (!got) return { result: "empty", message: "Type a number. A mix or a fraction is fine." };
    if (fractionsEqual(got, item.ans)) {
      return { result: "correct", message: "Yes! " + formatMixedFromND(item.ans.n, item.ans.d) + " is right." };
    }
    if (fractionsEqual({ n: -got.n, d: got.d }, item.ans)) {
      return { result: "almost", message: "Almost. You have the size. Check the minus sign." };
    }
    var noConvert = simplify(-(item.w1 * item.d1 + item.n1) + (item.w2 * item.d2 + item.n2), item.d1);
    if (item.d1 === item.d2 && fractionsEqual(got, noConvert)) {
      return { result: "try", message: "Not yet. Convert, then add." };
    }
    return { result: "try", message: "Not yet. Convert each mix. Then same bottom. Then add." };
  }

  function makeMixItem(rand) {
    var dens = [2, 3, 4, 5, 6, 8];
    var guard = 0;
    var d1, d2, n1, n2, w1, w2, ans;
    do {
      d1 = pick(dens, rand);
      d2 = pick(
        dens.filter(function (d) {
          return d !== d1;
        }),
        rand
      );
      n1 = 1 + Math.floor(rand() * (d1 - 1));
      n2 = 1 + Math.floor(rand() * (d2 - 1));
      var g1 = gcd(n1, d1);
      n1 /= g1;
      d1 /= g1;
      var g2 = gcd(n2, d2);
      n2 /= g2;
      d2 /= g2;
      if (d1 === d2) {
        d2 = d1 === 2 ? 3 : 2;
        n2 = 1;
      }
      w1 = 1 + Math.floor(rand() * 4);
      w2 = 1 + Math.floor(rand() * 3);
      ans = addSignedMixed(
        { sign: -1, whole: w1, num: n1, den: d1 },
        { sign: 1, whole: w2, num: n2, den: d2 }
      );
      guard += 1;
    } while (guard < 20 && (ans.d > 24 || Math.abs(ans.n) > 40));

    var item = { kind: "mix", w1: w1, n1: n1, d1: d1, w2: w2, n2: n2, d2: d2, ans: ans };
    item.promptHtml =
      "Add. Then make it simple.<br>" +
      htmlMixed(-(w1 * d1 + n1), d1) +
      " + " +
      htmlMixed(w2 * d2 + n2, d2);
    item.input = "fraction";
    item.hints = mixHints(item);
    item.modelHtml = mixModel(item);
    item.grade = function (raw) {
      return gradeMix(item, raw);
    };
    return item;
  }

  function signWord(sign) {
    return { "<": "less than", ">": "greater than", "<=": "at most", ">=": "at least" }[sign];
  }

  function gradeIneq(item, raw) {
    var got = parseIneqText(raw);
    if (!got) return { result: "empty", message: "Pick a sign or tap an answer." };
    if (item.accept.indexOf(got) !== -1) {
      return { result: "correct", message: "Yes! That comparison is right." };
    }
    if (item.almost && item.almost.indexOf(got) !== -1) {
      return { result: "almost", message: item.almostMsg };
    }
    return { result: "try", message: item.tryMsg || "Not yet. Divide first. Then look at the words." };
  }

  function makeIneqItem(rand) {
    var type = pick(["compare", "compare", "words", "equal-words"], rand);
    if (type === "compare") {
      var b = pick([2, 3, 4, 5, 6, 8], rand);
      var qWhole = 2 + Math.floor(rand() * 6);
      var rem = 1 + Math.floor(rand() * (b - 1));
      var a = qWhole * b + rem;
      var useLow = rand() < 0.5;
      var k = useLow ? qWhole : qWhole + 1;
      var sign = useLow ? ">" : "<";
      var almost = useLow ? ">=" : "<=";
      var item = {
        kind: "ineq",
        type: "compare",
        a: a,
        b: b,
        k: k,
        accept: [sign],
        almost: [almost],
        almostMsg: useLow
          ? "Almost. It is bigger. Use > because the numbers are not equal."
          : "Almost. It is smaller. Use < because the numbers are not equal.",
        tryMsg: "Divide " + a + " ÷ " + b + " first. Then compare to " + k + ".",
        input: "sign",
        promptHtml:
          "First find " +
          a +
          " ÷ " +
          b +
          ".<br>Then pick the sign: <span class='mn'>" +
          a +
          " ÷ " +
          b +
          " &nbsp;?&nbsp; " +
          k +
          "</span>",
        hints: [
          "Divide: " + a + " ÷ " + b + " is " + formatFrac(a, b) + " (about " + (a / b).toFixed(2) + ").",
          "Is that bigger or smaller than " + k + "?",
          "Use < if the left is smaller. Use > if the left is bigger.",
          "These two numbers are not the same, so do not use ≤ or ≥."
        ]
      };
      item.modelHtml =
        "<ol class='steps'><li>" +
        a +
        " ÷ " +
        b +
        " = " +
        htmlFrac(a, b) +
        ".</li><li>" +
        (a / b).toFixed(2) +
        " is " +
        signWord(sign) +
        " " +
        k +
        ".</li><li>Write " +
        a +
        " ÷ " +
        b +
        " " +
        sign +
        " " +
        k +
        ".</li></ol>";
      item.grade = function (raw) {
        return gradeIneq(item, raw);
      };
      return item;
    }

    if (type === "equal-words") {
      var letter = pick(["n", "w", "m", "t"], rand);
      var den = pick([3, 4, 5, 6, 8], rand);
      var bound = 2 + Math.floor(rand() * 8);
      var phrase = pick(
        [
          { words: "at most", sign: "<=", almost: "<", msg: "Almost. “At most” includes the number. Use ≤." },
          { words: "at least", sign: ">=", almost: ">", msg: "Almost. “At least” includes the number. Use ≥." },
          { words: "less than", sign: "<", almost: "<=", msg: "Almost. “Less than” leaves the number out. Use <." },
          { words: "greater than", sign: ">", almost: ">=", msg: "Almost. “Greater than” leaves the number out. Use >." }
        ],
        rand
      );
      var itemW = {
        kind: "ineq",
        type: "words",
        accept: [letter + "/" + den + phrase.sign + bound, phrase.sign],
        almost: [letter + "/" + den + phrase.almost + bound, phrase.almost],
        almostMsg: phrase.msg,
        tryMsg: "The first number is being split. It goes on top.",
        input: "choice",
        choices: [
          { value: letter + "/" + den + "<" + bound, html: letter + "/" + den + " < " + bound },
          { value: letter + "/" + den + ">" + bound, html: letter + "/" + den + " > " + bound },
          { value: letter + "/" + den + "<=" + bound, html: letter + "/" + den + " ≤ " + bound },
          { value: letter + "/" + den + ">=" + bound, html: letter + "/" + den + " ≥ " + bound }
        ],
        promptHtml:
          "The quotient of a number <b>" +
          letter +
          "</b> and <b>" +
          den +
          "</b> is <b>" +
          phrase.words +
          "</b> " +
          bound +
          ".<br>Pick the matching line.",
        hints: [
          "Quotient of " + letter + " and " + den + " means " + letter + " ÷ " + den + ". " + letter + " is on top.",
          "“" + phrase.words + "” is the sign " + phrase.sign.replace("<=", "≤").replace(">=", "≥") + ".",
          "Read it back: “" + letter + " split into " + den + " parts is " + phrase.words + " " + bound + ".”",
          "The number " + bound + " " + (phrase.sign.indexOf("=") >= 0 ? "is included." : "is left out.")
        ]
      };
      itemW.modelHtml =
        "<ol class='steps'><li>Quotient of " +
        letter +
        " and " +
        den +
        " → " +
        letter +
        "/" +
        den +
        ".</li><li>“" +
        phrase.words +
        "” → " +
        phrase.sign.replace("<=", "≤").replace(">=", "≥") +
        ".</li><li>" +
        letter +
        "/" +
        den +
        " " +
        phrase.sign.replace("<=", "≤").replace(">=", "≥") +
        " " +
        bound +
        ".</li></ol>";
      itemW.grade = function (raw) {
        return gradeIneq(itemW, raw);
      };
      return itemW;
    }

    var letter2 = pick(["n", "k", "p"], rand);
    var top = pick([12, 18, 20, 24, 30], rand);
    var bound2 = 2 + Math.floor(rand() * 5);
    var itemQ = {
      kind: "ineq",
      type: "words-flip",
      accept: [top + "/" + letter2 + "<" + bound2],
      almost: [letter2 + "/" + top + "<" + bound2],
      almostMsg: "Almost. " + top + " is the amount being split, so " + top + " goes on top.",
      tryMsg: "“Quotient of " + top + " and " + letter2 + "” means " + top + " ÷ " + letter2 + ".",
      input: "choice",
      choices: [
        { value: top + "/" + letter2 + "<" + bound2, html: top + "/" + letter2 + " < " + bound2 },
        { value: letter2 + "/" + top + "<" + bound2, html: letter2 + "/" + top + " < " + bound2 },
        { value: top + "/" + letter2 + "<=" + bound2, html: top + "/" + letter2 + " ≤ " + bound2 },
        { value: letter2 + "/" + top + "<=" + bound2, html: letter2 + "/" + top + " ≤ " + bound2 }
      ],
      promptHtml:
        "The quotient of <b>" +
        top +
        "</b> and a number <b>" +
        letter2 +
        "</b> is less than " +
        bound2 +
        ".<br>Pick the matching line.",
      hints: [
        top + " is the amount being cut. It goes on top.",
        "Less than means <. " + bound2 + " itself is left out.",
        "Write " + top + " ÷ " + letter2 + " < " + bound2 + ".",
        "Read it back. Does it match the words?"
      ]
    };
    itemQ.modelHtml =
      "<ol class='steps'><li>Quotient of " +
      top +
      " and " +
      letter2 +
      " → " +
      top +
      "/" +
      letter2 +
      ".</li><li>Less than → <.</li><li>" +
      top +
      "/" +
      letter2 +
      " < " +
      bound2 +
      ".</li></ol>";
    itemQ.grade = function (raw) {
      return gradeIneq(itemQ, raw);
    };
    return itemQ;
  }

  function powInt(base, exp) {
    var n = 1;
    for (var i = 0; i < exp; i++) n *= base;
    return n;
  }

  function gradeExp(item, raw) {
    var s = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/×/g, "*")
      .replace(/\^/g, "^");
    if (!s) return { result: "empty", message: "Type a power like 5^3, or a number." };
    if (item.accept.indexOf(s) !== -1) {
      return { result: "correct", message: "Yes! " + item.nice + " is right." };
    }
    var num = parseNumberLoose(s);
    if (num && item.value != null && fractionsEqual(num, { n: item.value, d: 1 })) {
      return { result: "correct", message: "Yes! " + item.nice + " is right." };
    }
    if (item.almost && item.almost.indexOf(s) !== -1) {
      return { result: "almost", message: item.almostMsg };
    }
    return { result: "try", message: item.tryMsg || "Not yet. Same base? Then use the matching rule." };
  }

  function makeExpItem(rand) {
    var type = pick(["product", "quotient", "power", "zero-mix"], rand);
    var base = pick([2, 3, 4, 5, 6, 7, 8, 10], rand);
    var item;

    if (type === "product") {
      var m = 2 + Math.floor(rand() * 3);
      var n = 2 + Math.floor(rand() * 3);
      var e = m + n;
      item = {
        kind: "exp",
        type: type,
        accept: [base + "^" + e, String(powInt(base, e))],
        almost: [base + "^" + m * n, String(m * n)],
        almostMsg: "Almost. When you multiply the same base, add the little numbers.",
        tryMsg: "Count factors. " + base + " appears " + m + " times, then " + n + " more.",
        value: powInt(base, e),
        nice: base + "^" + e,
        input: "power",
        promptHtml: "Write as one power.<br><span class='mn'>" + base + "<sup>" + m + "</sup> × " + base + "<sup>" + n + "</sup></span>",
        hints: [
          "The little number counts how many " + base + "s you multiply.",
          "Same base, multiply → add the little numbers: " + m + " + " + n + ".",
          "That makes " + base + "<sup>" + e + "</sup>.",
          "Do not multiply the little numbers. That is a different rule."
        ],
        modelHtml:
          "<ol class='steps'><li>Same base " +
          base +
          ".</li><li>Add little numbers: " +
          m +
          " + " +
          n +
          " = " +
          e +
          ".</li><li>" +
          base +
          "<sup>" +
          e +
          "</sup>.</li></ol>"
      };
    } else if (type === "quotient") {
      var topE = 5 + Math.floor(rand() * 3);
      var botE = 1 + Math.floor(rand() * 3);
      if (botE >= topE) botE = topE - 1;
      var e2 = topE - botE;
      item = {
        kind: "exp",
        type: type,
        accept: [base + "^" + e2, String(powInt(base, e2))],
        almost: [base + "^" + (topE + botE), base + "^" + topE / botE],
        almostMsg: "Almost. When you divide the same base, subtract the little numbers.",
        tryMsg: "Cancel matching factors on top and bottom.",
        value: powInt(base, e2),
        nice: base + "^" + e2,
        input: "power",
        promptHtml:
          "Write as one power.<br><span class='mn'>(" +
          base +
          "<sup>" +
          topE +
          "</sup>) ÷ (" +
          base +
          "<sup>" +
          botE +
          "</sup>)</span>",
        hints: [
          "Division cancels matching factors.",
          "Subtract little numbers: " + topE + " − " + botE + ".",
          "That makes " + base + "<sup>" + e2 + "</sup>.",
          "Keep the same big number (the base)."
        ],
        modelHtml:
          "<ol class='steps'><li>Same base " +
          base +
          ".</li><li>Subtract: " +
          topE +
          " − " +
          botE +
          " = " +
          e2 +
          ".</li><li>" +
          base +
          "<sup>" +
          e2 +
          "</sup>.</li></ol>"
      };
    } else if (type === "power") {
      var inner = 2 + Math.floor(rand() * 2);
      var outer = 2 + Math.floor(rand() * 2);
      var e3 = inner * outer;
      item = {
        kind: "exp",
        type: type,
        accept: [base + "^" + e3, String(powInt(base, e3))],
        almost: [base + "^" + (inner + outer), String(inner + outer)],
        almostMsg: "Almost. A power of a power: multiply the little numbers.",
        tryMsg: "The outside little number stacks more copies of the inside power.",
        value: powInt(base, e3),
        nice: base + "^" + e3,
        input: "power",
        promptHtml: "Write as one power.<br><span class='mn'>(" + base + "<sup>" + inner + "</sup>)<sup>" + outer + "</sup></span>",
        hints: [
          "(" + base + "<sup>" + inner + "</sup>)<sup>" + outer + "</sup> means " + outer + " copies of " + base + "<sup>" + inner + "</sup>.",
          "Multiply the little numbers: " + inner + " × " + outer + ".",
          "That makes " + base + "<sup>" + e3 + "</sup>.",
          "Do not add here. Adding is for " + base + "<sup>a</sup> × " + base + "<sup>b</sup>."
        ],
        modelHtml:
          "<ol class='steps'><li>Power of a power.</li><li>Multiply little numbers: " +
          inner +
          " × " +
          outer +
          " = " +
          e3 +
          ".</li><li>" +
          base +
          "<sup>" +
          e3 +
          "</sup>.</li></ol>"
      };
    } else {
      var p = 3 + Math.floor(rand() * 3);
      var q = 1 + Math.floor(rand() * 2);
      var e4 = p + 0 - q;
      item = {
        kind: "exp",
        type: type,
        accept: [base + "^" + e4, String(powInt(base, e4))],
        almost: ["0", base + "^0", String(powInt(base, p))],
        almostMsg: "Almost. A zero little number means 1, not 0. It does not wipe the rest out.",
        tryMsg: "Do the product, then the quotient. A zero exponent is 1.",
        value: powInt(base, e4),
        nice: base + "^" + e4,
        input: "power",
        promptHtml:
          "Write as one power.<br><span class='mn'>(" +
          base +
          "<sup>" +
          p +
          "</sup> × " +
          base +
          "<sup>0</sup>) ÷ " +
          base +
          "<sup>" +
          q +
          "</sup></span>",
        hints: [
          base + "<sup>0</sup> = 1. Multiplying by 1 does not change the other power.",
          "Add: " + p + " + 0 = " + p + ".",
          "Then subtract: " + p + " − " + q + " = " + e4 + ".",
          "So " + base + "<sup>" + e4 + "</sup>."
        ],
        modelHtml:
          "<ol class='steps'><li>" +
          base +
          "<sup>0</sup> = 1.</li><li>" +
          base +
          "<sup>" +
          p +
          "</sup> × 1 = " +
          base +
          "<sup>" +
          p +
          "</sup>.</li><li>Divide: " +
          p +
          " − " +
          q +
          " = " +
          e4 +
          ".</li><li>" +
          base +
          "<sup>" +
          e4 +
          "</sup>.</li></ol>"
      };
    }

    item.grade = function (raw) {
      return gradeExp(item, raw);
    };
    return item;
  }

  function gradePay(item, raw) {
    if (item.input === "choice") {
      var got = String(raw || "").trim();
      if (!got) return { result: "empty", message: "Tap one answer." };
      if (got === item.accept[0]) return { result: "correct", message: "Yes. The percent is of sales." };
      if (item.almost && item.almost.indexOf(got) !== -1) {
        return { result: "almost", message: "Almost. Base pay is added after. The percent acts on sales." };
      }
      return { result: "try", message: "Ask: percent of what?" };
    }
    var num = parseNumberLoose(raw);
    if (!num) return { result: "empty", message: "Type the dollar amount. Just the number is fine." };
    if (fractionsEqual(num, { n: item.ans, d: 1 })) {
      return { result: "correct", message: "Yes! $" + item.ans + "." };
    }
    if (item.almostNums) {
      for (var i = 0; i < item.almostNums.length; i++) {
        if (fractionsEqual(num, { n: item.almostNums[i].n, d: 1 })) {
          return { result: "almost", message: item.almostNums[i].msg };
        }
      }
    }
    return { result: "try", message: item.tryMsg || "Not yet. Name the base. Then use pay = base + percent × sales." };
  }

  function makePayItem(rand) {
    var bases = [180, 200, 220, 250, 280, 300, 350, 400, 500];
    var rates = [4, 5, 8, 10, 12];
    var salesList = [400, 500, 600, 750, 800, 900, 1000, 1200, 1250, 1500];
    var base, rate, sales, comm, guard = 0;
    do {
      base = pick(bases, rand);
      rate = pick(rates, rand);
      sales = pick(salesList, rand);
      comm = (sales * rate) / 100;
      guard += 1;
    } while (guard < 30 && comm !== Math.round(comm));
    comm = Math.round(comm);
    var earnings = base + comm;
    var type = pick(["forward", "forward", "reverse", "base"], rand);

    var item;
    if (type === "base") {
      item = {
        kind: "pay",
        type: type,
        accept: ["sales"],
        almost: ["basepay"],
        input: "choice",
        choices: [
          { value: "sales", html: "The sales amount" },
          { value: "basepay", html: "The $" + base + " base pay" },
          { value: "earnings", html: "The total pay" },
          { value: "rate", html: "The number " + rate }
        ],
        promptHtml:
          "A stall pays <b>$" +
          base +
          "</b> plus <b>" +
          rate +
          "% of sales</b>.<br>The " +
          rate +
          "% is a percent of what?",
        hints: [
          "Ask: percent of what?",
          "The words say “of sales.”",
          "The $" + base + " is extra money added after.",
          "Tag SALES as the base of the percent."
        ],
        modelHtml:
          "<ol class='steps'><li>“" +
          rate +
          "% of sales” names the base: sales.</li><li>$" +
          base +
          " is added after.</li></ol>"
      };
    } else if (type === "forward") {
      item = {
        kind: "pay",
        type: type,
        ans: earnings,
        accept: [String(earnings)],
        almostNums: [
          { n: comm, msg: "Almost. That is just the extra from sales. Add the $" + base + " base pay." },
          { n: Math.round((base * rate) / 100) + base, msg: "Almost. The percent is of sales, not of the base pay." },
          { n: Math.round(sales * rate), msg: "Almost. " + rate + "% is " + rate + " / 100, not × " + rate + "." }
        ],
        tryMsg: "Find " + rate + "% of $" + sales + ". Then add $" + base + ".",
        input: "money",
        promptHtml:
          "Pay is <b>$" +
          base +
          "</b> plus <b>" +
          rate +
          "%</b> of sales.<br>Sales are <b>$" +
          sales.toLocaleString("en-US") +
          "</b>. What is the pay?",
        hints: [
          rate + "% means " + rate + " out of 100. That is " + (rate / 100).toFixed(2) + ".",
          "Extra pay = " + (rate / 100).toFixed(2) + " × " + sales + " = " + comm + ".",
          "Now add base pay: " + base + " + " + comm + ".",
          "The percent does not act on the $" + base + "."
        ],
        modelHtml:
          "<ol class='steps'><li>Rate = " +
          rate +
          "/100 = " +
          (rate / 100).toFixed(2) +
          ".</li><li>Extra = " +
          (rate / 100).toFixed(2) +
          " × " +
          sales +
          " = " +
          comm +
          ".</li><li>Pay = " +
          base +
          " + " +
          comm +
          " = " +
          earnings +
          ".</li></ol>"
      };
    } else {
      item = {
        kind: "pay",
        type: type,
        ans: sales,
        accept: [String(sales)],
        almostNums: [
          { n: comm, msg: "Almost. That is the extra piece. Now divide it by the rate to get sales." },
          { n: earnings - base, msg: "Good start: extra pay is $" + comm + ". Divide that by " + (rate / 100).toFixed(2) + "." },
          { n: Math.round((earnings - base) / rate), msg: "Almost. Divide by " + rate + "/100, not by " + rate + "." }
        ],
        tryMsg: "Take off the base pay first. What is left is the percent piece.",
        input: "money",
        promptHtml:
          "Pay is <b>$" +
          base +
          "</b> plus <b>" +
          rate +
          "%</b> of sales.<br>Total pay is <b>$" +
          earnings.toLocaleString("en-US") +
          "</b>. What were the sales?",
        hints: [
          "Undo the base pay: " + earnings + " − " + base + " = " + comm + " is the extra.",
          "Extra = " + (rate / 100).toFixed(2) + " × sales.",
          "Sales = " + comm + " ÷ " + (rate / 100).toFixed(2) + ".",
          "Do not divide by " + rate + ". Divide by " + rate + "/100."
        ],
        modelHtml:
          "<ol class='steps'><li>" +
          earnings +
          " − " +
          base +
          " = " +
          comm +
          " extra.</li><li>" +
          comm +
          " ÷ " +
          (rate / 100).toFixed(2) +
          " = " +
          sales +
          ".</li><li>Sales were $" +
          sales.toLocaleString("en-US") +
          ".</li></ol>"
      };
    }

    item.grade = function (raw) {
      return gradePay(item, raw);
    };
    return item;
  }

  var TEACH = {
    mix: [
      {
        coach: "A mix number is a whole plus a leftover part.",
        body:
          "<p>3 1/2 means 3 wholes and a half left over.</p>" +
          "<p class='gloss'>Mix number = a whole + a part.</p>" +
          "<div class='demo'>" +
          htmlMixed(7, 2) +
          " <span class='eq'>=</span> 3 wholes + " +
          htmlFrac(1, 2) +
          "</div>"
      },
      {
        coach: "You can smash a mix into one fraction.",
        body:
          "<p>Multiply the whole by the bottom number. Add the top. Keep the bottom.</p>" +
          "<div class='demo'>2 1/4 → (2 × 4 + 1)/4 = " +
          htmlFrac(9, 4) +
          "</div>" +
          "<p class='gloss'>One tall fraction = the same amount, written as parts only.</p>"
      },
      {
        coach: "A minus sticks to the whole mix. It does not stay behind.",
        body:
          "<p>−2 1/3 is the whole pile going down.</p>" +
          "<div class='demo'>−2 1/3 = " +
          htmlFrac(-7, 3) +
          "</div>" +
          "<p>The minus rides with 7/3. Do not drop it.</p>"
      },
      {
        coach: "Parts add only when they are the same size.",
        body:
          "<p>Halves and sixths are different sizes. Recut first.</p>" +
          "<div class='demo'>" +
          htmlFrac(1, 2) +
          " = " +
          htmlFrac(3, 6) +
          "</div>" +
          "<p class='gloss'>Same bottom number = same-size pieces.</p>"
      },
      {
        coach: "Then add the tops. Last, make it simple.",
        body:
          "<p>Keep the bottom. Add the tops. Then shrink if you can.</p>" +
          "<div class='demo'>" +
          htmlFrac(-14, 6) +
          " + " +
          htmlFrac(11, 6) +
          " = " +
          htmlFrac(-3, 6) +
          " = " +
          htmlFrac(-1, 2) +
          "</div>"
      }
    ],
    ineq: [
      {
        coach: "A quotient is the answer when you divide.",
        body:
          "<p>12 ÷ 3 = 4. The quotient is 4.</p>" +
          "<p class='gloss'>Quotient = divide answer.</p>" +
          "<div class='demo'>20 ÷ 5 = <b>4</b></div>"
      },
      {
        coach: "“Quotient of A and B” means A ÷ B. A is on top.",
        body:
          "<p>Who is being split? That number goes on top.</p>" +
          "<div class='demo'>quotient of n and 5 → n/5</div>" +
          "<p>Watch the flip: quotient of 12 and k → 12/k.</p>"
      },
      {
        coach: "These four signs compare two amounts.",
        body:
          "<ul class='sign-list'>" +
          "<li><b>&lt;</b> less than — left is smaller</li>" +
          "<li><b>&gt;</b> greater than — left is bigger</li>" +
          "<li><b>≤</b> at most — smaller or the same</li>" +
          "<li><b>≥</b> at least — bigger or the same</li>" +
          "</ul>"
      },
      {
        coach: "“Less than” leaves the number out.",
        body:
          "<p>Is 8 less than 8? No. So use &lt;, not ≤.</p>" +
          "<p>“At most 8” does include 8. That is ≤.</p>" +
          "<div class='demo'>n/5 &lt; 8 &nbsp;and&nbsp; n/4 ≤ 11</div>"
      }
    ],
    exp: [
      {
        coach: "The little number counts copies of the big number.",
        body:
          "<p>5<sup>3</sup> means 5 × 5 × 5.</p>" +
          "<p class='gloss'>Exponent = little counting number. Base = the big number you multiply.</p>"
      },
      {
        coach: "Same base, multiply? Add the little numbers.",
        body:
          "<div class='demo'>a<sup>4</sup> × a<sup>3</sup> = a<sup>7</sup></div>" +
          "<p>Four copies, then three more, is seven copies.</p>"
      },
      {
        coach: "Same base, divide? Subtract the little numbers.",
        body:
          "<div class='demo'>a<sup>5</sup> ÷ a<sup>2</sup> = a<sup>3</sup></div>" +
          "<p>Two copies on the bottom cancel two on top.</p>"
      },
      {
        coach: "A power of a power? Multiply the little numbers.",
        body:
          "<div class='demo'>(a<sup>2</sup>)<sup>3</sup> = a<sup>6</sup></div>" +
          "<p>Three copies of a<sup>2</sup> is six a’s.</p>"
      },
      {
        coach: "A zero little number means 1 (if the base is not 0).",
        body:
          "<p>a<sup>0</sup> = 1 so the add rule still works.</p>" +
          "<div class='demo'>a<sup>5</sup> × a<sup>0</sup> = a<sup>5</sup></div>" +
          "<p>It is not 0. Multiplying by 0 would wipe the other power out.</p>"
      }
    ],
    pay: [
      {
        coach: "Percent means “out of 100.”",
        body:
          "<p>5% = 5 out of every 100 = 0.05.</p>" +
          "<p class='gloss'>Percent = a rate. p% = p/100.</p>"
      },
      {
        coach: "Always ask: percent of what?",
        body:
          "<p>In “$280 plus 5% of sales,” the 5% acts on sales.</p>" +
          "<p>The $280 is a separate add-on. Do not take 5% of $280.</p>"
      },
      {
        coach: "Pay = base pay + percent × sales.",
        body:
          "<div class='demo'>Pay = 280 + 0.05 × sales</div>" +
          "<p>If sales are $640: extra = 32. Pay = 280 + 32 = $312.</p>"
      },
      {
        coach: "Going backward: take off base pay, then divide.",
        body:
          "<p>If pay is $400: 400 − 280 = 120 extra.</p>" +
          "<p>120 ÷ 0.05 = $2,400 sales.</p>" +
          "<p>Divide by the rate, not by 5.</p>"
      }
    ]
  };

  function emptyProgress() {
    var p = { version: 1, missions: {} };
    MISSIONS.forEach(function (m) {
      p.missions[m.id] = {
        stars: 0,
        mastered: false,
        streak: 0,
        bestStreak: 0,
        taught: false,
        correct: 0,
        attempts: 0
      };
    });
    return p;
  }

  function loadProgress(storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) return emptyProgress();
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return emptyProgress();
      var data = JSON.parse(raw);
      var fresh = emptyProgress();
      if (!data || !data.missions) return fresh;
      MISSIONS.forEach(function (m) {
        var src = data.missions[m.id] || {};
        fresh.missions[m.id] = Object.assign(fresh.missions[m.id], src);
      });
      return fresh;
    } catch (err) {
      return emptyProgress();
    }
  }

  function saveProgress(progress, storage) {
    storage = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function isUnlocked(progress, missionId) {
    var idx = MISSIONS.findIndex(function (m) {
      return m.id === missionId;
    });
    if (idx <= 0) return true;
    return !!progress.missions[MISSIONS[idx - 1].id].mastered;
  }

  function applyGrade(progress, missionId, result) {
    var row = progress.missions[missionId];
    row.attempts += 1;
    if (result === "correct") {
      row.correct += 1;
      row.streak += 1;
      if (row.streak > row.bestStreak) row.bestStreak = row.streak;
      if (row.streak > row.stars) row.stars = Math.min(5, row.streak);
      if (row.streak >= MASTERY_STREAK) {
        row.mastered = true;
        row.stars = Math.max(row.stars, 4);
      }
    } else if (result === "almost" || result === "try") {
      row.streak = 0;
    }
    return row;
  }

  function markTaught(progress, missionId) {
    progress.missions[missionId].taught = true;
  }

  function nextHintIndex(shown) {
    return shown;
  }

  function hintText(item, shown) {
    if (!item.hints || !item.hints.length) return "";
    var i = Math.min(shown, item.hints.length - 1);
    return item.hints[i];
  }

  function makeItem(missionId, rand) {
    if (missionId === "mix") return makeMixItem(rand);
    if (missionId === "ineq") return makeIneqItem(rand);
    if (missionId === "exp") return makeExpItem(rand);
    if (missionId === "pay") return makePayItem(rand);
    return makeMixItem(rand);
  }

  function nextMissionId(id) {
    var i = MISSIONS.findIndex(function (m) {
      return m.id === id;
    });
    if (i < 0 || i === MISSIONS.length - 1) return null;
    return MISSIONS[i + 1].id;
  }

  return {
    MISSIONS: MISSIONS,
    TEACH: TEACH,
    STORAGE_KEY: STORAGE_KEY,
    MASTERY_STREAK: MASTERY_STREAK,
    HINT_AFTER_WRONG: HINT_AFTER_WRONG,
    gcd: gcd,
    lcm: lcm,
    simplify: simplify,
    fractionsEqual: fractionsEqual,
    mixedToImproper: mixedToImproper,
    toMixed: toMixed,
    formatFrac: formatFrac,
    formatMixedFromND: formatMixedFromND,
    htmlFrac: htmlFrac,
    htmlMixed: htmlMixed,
    makeRng: makeRng,
    pick: pick,
    parseNumberLoose: parseNumberLoose,
    parseIneqText: parseIneqText,
    addSignedMixed: addSignedMixed,
    makeMixItem: makeMixItem,
    makeIneqItem: makeIneqItem,
    makeExpItem: makeExpItem,
    makePayItem: makePayItem,
    makeItem: makeItem,
    gradeMix: gradeMix,
    gradeIneq: gradeIneq,
    gradeExp: gradeExp,
    gradePay: gradePay,
    emptyProgress: emptyProgress,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    isUnlocked: isUnlocked,
    applyGrade: applyGrade,
    markTaught: markTaught,
    hintText: hintText,
    nextHintIndex: nextHintIndex,
    nextMissionId: nextMissionId
  };
});
