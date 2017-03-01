function initTinyMCE() {
	var c = [];

	//Load textcolor_map
	if (array != null) {
		for (var i = 0; i < array.length; i++) {
			c.push(array[i].toString().replace("#", ""));
			c.push("");
		}
	}

	tinymce.init({
		selector: 'div[data-type="editable"]',
		inline: true,
		theme: 'modern',
		plugins: [
			'advlist lists image charmap hr anchor',
			'searchreplace wordcount visualblocks visualchars code fullscreen',
			'insertdatetime media nonbreaking table contextmenu directionality',
			'emoticons template paste textcolor colorpicker textpattern imagetools codesample toc'
		],
		toolbar: false,
		toolbar1: false,
		menu: {},
		fixed_toolbar_container: '#toolbar',
		height: 30,
		textcolor_map: c,
		textcolor_cols: "2",
		textcolor_rows: "3",
		setup: function(ed) {
			ed.on('change', function(e) {
				globals.saved = false;
				document.title = globals.title + " - " + (globals.file.subject || "") + " - " + (globals.file.name || "New File") + "*";
			});
		},
	});
}

$(document).ready(function() {
	$("[data-tinymce-cmd]").click(function() {
		console.log("click");
		tinymce.execCommand($(this).data("tinymce-cmd"));
		$(this).toggleClass("editor-cmd-toggled");
	});
});
