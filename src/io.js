import fs from 'fs';
import { remote } from 'electron';
import $ from 'jquery';
var dialog = remote.dialog;

var template = '<!doctype html> <html> <head> <meta charset="utf-8"> <title>StudyJS</title> <link href="css/main.css" rel="stylesheet" type="text/css"> <link rel="stylesheet" href="css/bootstrap.min.css"> </head> <body> <script src="js/jquery-3.1.1.min.js"></script> <script> window.jQuery = window.$; $(document).ready(function() { loadViewer(); }); </script> <script src="js/bootstrap.min.js"></script> <script src="js/viewer.js"></script> <script src="js/globals.js"></script> <div id="document"> <!--replaceme--> </div> </body> </html>';

var appIO = {
  saveFile : function () {
    if (globals.currentFile == null) {
      dialog.showSaveDialog(function (fileName) {
        if (fileName === undefined){
          return;
        }
        globals.currentFile = fileName;
        write();
      });
    } else {
      write();
    }
  },
  openFile : function () {
    var r = true;
    if (!globals.saved)
      r = confirm("Close without saving?");

    if (r == true) {
      $("#document").html("");
    } else {
      return;
    }

    dialog.showOpenDialog(function (fileNames) {
         if(fileNames === undefined){
              console.log("No file selected");
         }else{
           fs.readFile(fileNames[0], function (err, data) {
              if (err) {
                 return console.error(err);
              }
              globals.currentFile = fileNames[0];
              document.title = globals.projectTitle + " - " + globals.currentFile;
              $("#document").html(data.toString());
              $("#document").find('*').each(function () {
                $(this).removeAttr("id spellcheck contenteditable");
                $(this).removeClass("mce-content-body mce-edit-focus");
              });
              initTinyMCE();
              loadViewer();
           });
         }
    });
  },
  newFile : function () {
    var r = true;
    if (!globals.saved)
      r = confirm("Close without saving?");

    if (r == true) {
      $("#document").html("<div data-type='container' data-depth='0'><div class='panel panel-default'><div class='panel-heading' data-type='editable'></div></div></div>");
    } else {
      return;
    }

    $("#document").find('*').each(function () {
      $(this).removeAttr("id spellcheck contenteditable");
      $(this).removeClass("mce-content-body mce-edit-focus");
    });

    globals.currentFile = null;
    document.title = globals.projectTitle + " - " + (globals.currentFile || "New File");
    initTinyMCE();
    loadViewer();
  },
  exportFile : function () {
    var newDoc = $('<div id="document2"></div>').appendTo($(document.body));
    newDoc.html($("#document").html());

    newDoc.find('*').each(function () {
      $(this).removeAttr("id spellcheck contenteditable");
      $(this).removeClass("mce-content-body mce-edit-focus");
    });

    var file = template.replace("<!--replaceme-->", newDoc.html());
    newDoc.remove();

    dialog.showOpenDialog({
        title:"Select a folder",
        properties: ["openDirectory"]
    },function (folderPaths) {
        // folderPaths is an array that contains all the selected paths
        if(folderPaths === undefined){
            console.log("No destination folder selected");
            return;
        }else{
            console.log(folderPaths);
            var fileName = folderPaths[0].split("/")[folderPaths[0].split("/").length - 1];
            console.log(fileName);

            fs.writeFile(folderPaths[0] + "/" + fileName, file,  function(err) {
               if (err) {
                  return console.error(err);
               }
               console.log("Data written successfully!");
            });
        }
    });
  }
};

function write() {
  tinymce.remove('div[data-type="editable"]');
  fs.writeFile(globals.currentFile, $("#document")[0].innerHTML,  function(err) {
     if (err) {
        return console.error(err);
     }

     console.log("Data written successfully!");
     document.title = globals.title + " - " + globals.currentFile;
     globals.saved = true;
  });
  initTinyMCE();
}

export {appIO};
