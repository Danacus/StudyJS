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

    console.log(div.parents("div[data-type='container']").length);

    div.attr("data-depth", div.parents("div[data-type='container']").length);

    initTinyMCE();
    loadViewer();
    //console.log(parseInt(div.children(":first").attr("id").replace("mce_", "")));
    tinymce.get(parseInt(div.find(".mce-content-body").attr("id").replace("mce_", "") - 1)).focus();
  },

  addBody : function () {
    var parent = $(".mce-edit-focus").parents(".panel").first();
    console.log(parent);
    var div = $("<div class='panel-body' data-type='editable' style='min-height: 0px'></div>").appendTo(parent);
    div.animate({"min-height":"50px"}, 100, function() {
      initTinyMCE();
      loadViewer();
      tinymce.get(parseInt(div.attr("id").replace("mce_", "") - 1)).focus();
    });
  }
};

export {editor};
