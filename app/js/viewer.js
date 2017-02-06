function loadViewer() {
  $("div[data-type='open']").each(function () {
    $(this).remove();
  })


  $("div[data-type='container']").each(function() {
    var target = $(this)[0];
    var div = $("<div data-type='open' data-open='true'><span class='glyphicon glyphicon-chevron-right'></span></div>").insertBefore($(this));
    div.css({
      "height": "15px",
      "width": "15px",
      "margin-top": "10px",
      "margin-left": "5px",
      "position": "absolute",
      'transform' : 'rotate(90deg)'
    });

    div.click(function() {
      /*
      $(target).find("div[data-type='open']").toggle();
      $(target).children("div[data-type='container']").slideToggle("fast");
      $(target).find(".panel-body").slideToggle("fast");

      if ($(this).data("open") == 'true') {
        $(this).data("open", 'false');
        $(this).animateRotate(90, {
          duration: 100,
          easing: 'linear',
          complete: function () {},
          step: function () {}
        });
      } else {
        $(this).data("open", 'true');
        $(this).animateRotate(0, {
          duration: 100,
          easing: 'linear',
          complete: function () {},
          step: function () {}
        });
      }*/
      open($(target), $(this));
    });
  });
}

function open(target, div) {
  target.find("div[data-type='open']").toggle();
  target.children("div[data-type='container']").slideToggle("fast");
  target.find(".panel-body").slideToggle("fast");

  if (div.data("open") == 'true') {
    div.data("open", 'false');
    div.animateRotate(90, {
      duration: 100,
      easing: 'linear',
      complete: function () {},
      step: function () {}
    });
  } else {
    div.data("open", 'true');
    div.animateRotate(0, {
      duration: 100,
      easing: 'linear',
      complete: function () {},
      step: function () {}
    });
  }
}

function getIndex(x, array) {
  var arr = array;

  for (var i = 0; i < arr.length; i++) {
    for (var j = 0; j < arr[i].name.length; j++) {
      if (x == array[i].name[j]) {
        return i;
      }
    }
  }

  return null;
}

$.fn.animateRotate = function(angle, duration, easing, complete) {
  var args = $.speed(duration, easing, complete);
  var step = args.step;
  return this.each(function(i, e) {
    args.complete = $.proxy(args.complete, e);
    args.step = function(now) {
      $.style(e, 'transform', 'rotate(' + now + 'deg)');
      if (step) return step.apply(e, arguments);
    };

    $({deg: 0}).animate({deg: angle}, args);
  });
};
