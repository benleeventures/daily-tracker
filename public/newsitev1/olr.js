
(function () {
  var boxes = document.querySelectorAll('#checks input');
  var tally = document.getElementById('tally');
  var cta = document.getElementById('tally-cta');
  function update() {
    var n = 0;
    boxes.forEach(function (b) { if (b.checked) n++; });
    if (n === 0) { tally.textContent = 'Tap the ones that are true.'; cta.hidden = true; return; }
    if (n < 3) { tally.textContent = n + ' of ' + boxes.length + '. Worth a look.'; cta.hidden = true; return; }
    tally.textContent = n + ' of ' + boxes.length + '. This is what the Pipe Audit is for.';
    cta.hidden = false;
  }
  boxes.forEach(function (b) { b.addEventListener('change', update); });
  update();
})();
