(function () {
  const body = document.body;
  const prefix = body.getAttribute("data-prefix") || "";
  const page = body.getAttribute("data-page") || "";

  function mark(current) {
    return current ? ' aria-current="page"' : "";
  }

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="skip" href="#main">Skip to lesson</a>
    <div class="bar">
      <a class="brand" href="${prefix}index.html">
        <img src="${prefix}img/mark.svg" alt="" width="48" height="48">
        <span>
          <strong>Dragon Hall Math</strong>
          <span>Skills pack for one learner</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div>
    <nav class="site-nav" id="site-nav">
      <a href="${prefix}index.html"${mark(page === "home")}>Home</a>
      <a href="${prefix}lessons/signed-mixed.html"${mark(page === "signed")}>Signed mixed</a>
      <a href="${prefix}lessons/inequality.html"${mark(page === "ineq")}>Inequalities</a>
      <a href="${prefix}lessons/exponents.html"${mark(page === "exp")}>Exponents</a>
      <a href="${prefix}lessons/percent-pay.html"${mark(page === "pay")}>Percent pay</a>
      <a href="${prefix}print.html"${mark(page === "print")}>Print packet</a>
    </nav>
  `;

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap">
      <p><strong>Dragon Hall Commons</strong> pedagogy, adapted for the web.</p>
      <p class="fine">Lesson scripts and practice ideas adapted from
        <a href="https://github.com/AlexBarba-x/commons">AlexBarba-x/commons</a>
        (CC BY-SA 4.0). Voice and original examples reshaped for this site.
        Problems here are original isomorphic practice — not copied from any test-prep worksheet.</p>
      <p class="fine">The adult confirms grades. Reveal keys stay hidden until a grown-up opens them.</p>
    </div>
  `;

  body.prepend(header);
  body.append(footer);

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector("#site-nav");
  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/÷/g, "/")
      .replace(/·/g, "*");
  }

  function accept(actual, accepted) {
    const got = normalize(actual);
    return accepted.some(function (item) {
      return normalize(item) === got;
    });
  }

  document.querySelectorAll("[data-check]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const accepted = JSON.parse(form.getAttribute("data-accept") || "[]");
      const box = form.querySelector("[name='answer']");
      const chosen = form.querySelector("input[name='answer']:checked");
      const value = box ? box.value : (chosen ? chosen.value : "");
      const out = form.querySelector(".feedback");
      if (accept(value, accepted)) {
        out.className = "feedback ok";
        out.textContent = "Yes. That matches the skill.";
      } else {
        out.className = "feedback no";
        out.textContent = "Not yet. Try the steps again. A grown-up can open the reveal if you are stuck.";
      }
    });
  });

  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    }
  }

  if (document.readyState === "complete") {
    renderMath();
  } else {
    window.addEventListener("load", renderMath);
  }
})();
