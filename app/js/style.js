
var colors = [];
var array = null;

$(document).ready(function () {
  if (colors != null)
    array = colors;
})

function setColors(a) {
  console.log("set colors");
  array = a;
}

function updateColors() {
  if (array == null) return;

  for (var i = 0; i < array.length; i++) {
    $("div[data-depth="+ i +"]").find(".panel-heading").css({
      "background-color": array[i]
    });
  }
}
