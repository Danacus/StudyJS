import $ from 'jquery';

var container = "<div data-type='container' data-depth='0'><div class='panel panel-default'><div class='panel-heading' data-type='editable'></div></div></div>";

var editor = {
  add : {
    before: 1,
    after: 2,
    child: 3,
    parent: 4
  },

  addContainer : function (type, attributes = {}) {
    var div;
    var parent = $(".mce-edit-focus").parents("div[data-type='container']").first();

    switch (type) {
      case 1:
        div = $(container).insertBefore(parent);
        break;
      case 2:
        div = $(container).insertAfter(parent);
        break;
      case 3:
        div = $(container).appendTo(parent);
        break;
      case 4:
        //div = $(container).prependTo($(".mce-edit-focus"));
        break;
      default:
        return;
    }

    animateContainer(div);

    console.log(div.parents("div[data-type='container']").length);

    div.attr("data-depth", div.parents("div[data-type='container']").length);

    /*
    initTinyMCE();
    //loadViewer();
    //console.log(parseInt(div.children(":first").attr("id").replace("mce_", "")));
    tinymce.get(div.find(".mce-content-body").attr("id")).focus();*/
  },

  addBody : function () {
    var parent = $(".mce-edit-focus").parents(".panel").first();
    console.log(parent);
    var div = $("<div class='panel-body' data-type='editable' style='min-height: 0px'></div>").appendTo(parent);
    div.animate({"min-height":"50px"}, 100, function() {
      initTinyMCE();
      //loadViewer();
      tinymce.get(/*parseInt(div.attr("id").replace("mce_", "") - 1)*/ div.attr("id")).focus();
    });
  }
};

function animateContainer(div) {
  div.children(":first").children(".panel-heading").animate({"min-height":"50px"}, 100, function() {
    initTinyMCE();
    //loadViewer();
    tinymce.get(/*parseInt(div.attr("id").replace("mce_", "") - 1)*/ div.find(".mce-content-body").attr("id")).focus();
  });
}

var removeNode = false;
var removeDown = false;

$(window).keyup(function(e){
  //BACKSPACE / DELETE
  if (e.keyCode == 8 || e.keyCode == 46) {
    if (removeDown) {
      removeNode = true;
    }
  }
});

$(window).keydown(function(e) {
  //BACKSPACE / DELETE
  if (e.keyCode == 8 || e.keyCode == 46) {
    if (removeNode) {
      remove();
      removeNode = false;
    } else {
      removeDown = true;
    }
  } else {
    removeNode = false;
  }
});

function remove() {
  console.log("remove");
  if ($(".mce-edit-focus").hasClass("panel-body")) {
    if ($(".mce-edit-focus").text() == "") {
      var focus = $(".mce-edit-focus")[0];
      var parent = $(focus).parent().children(".panel-heading")[0];
      initTinyMCE();
      tinymce.get(/*parseInt(div.attr("id").replace("mce_", "") - 1)*/ $(parent).attr("id")).focus();
      $(focus).slideUp("fast", function() {
        $(focus).remove();
        //loadViewer();
      });
    }
  } else if ($(".mce-edit-focus").hasClass("panel-heading") && $(".mce-edit-focus").parents("div[data-type='container']").length > 1) {
    if ($(".mce-edit-focus").parents("div[data-type='container']").first().text() == "") {
      var focus = $(".mce-edit-focus")[0];
      $(focus).children().not("div[data-type='container']").remove();
      var parent = $(focus).parents("div[data-type='container']").first().parents("div[data-type='container']").first().find(".panel-heading")[0];
      initTinyMCE();
      tinymce.get(/*parseInt(div.attr("id").replace("mce_", "") - 1)*/ $(parent).attr("id")).focus();
      $(focus).slideUp("fast", function() {
        $(focus).parents("div[data-type='container']").first().remove();
        //loadViewer();
      });
    }
  }
}

export {editor};
