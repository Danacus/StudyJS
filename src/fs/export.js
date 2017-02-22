var template = `
	<!doctype html>
	<html>

	<head>
	    <meta charset="utf-8">
	    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
	    <title>StudyJS</title>
	    <link href="css/main.css" rel="stylesheet" type="text/css">
			<link rel="stylesheet" href="css/bootstrap.min.css">
	    <body>
	        <script src="js/jquery-3.1.1.min.js"></script>
	        <script>
	            window.jQuery = window.$;
	            $(document).ready(function() {
	                loadViewer();
	            });
	        </script>
	        <script type="text/x-mathjax-config"> MathJax.Hub.Config({ tex2jax: { inlineMath: [["$","$"]] }, CommonHTML: { scale: 100 } }); </script>
	        <script type="text/javascript" async src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_CHTML">
	        </script>
	        <script src="js/bootstrap.min.js"></script>
	        <script src="js/viewer.js"></script>
	        <div id="document">
	            <!--replaceme-->
	        </div>
	    </body>

	</html>
`;

function exportFile() {
	let newDoc = $('<div id="document2"></div>').appendTo($(document.body));
	$(".eq-math").each(() => {
		$(this).html($(this).data("formula"));
	});
	newDoc.html($("#document").html());

	newDoc.find('*').each(function() {
		$(this).removeAttr("id spellcheck contenteditable");
		$(this).removeClass("mce-content-body mce-edit-focus");
	});

	const file = template.replace("<!--replaceme-->", newDoc.html());

	MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

	newDoc.remove();
	return file;
}

export {
	exportFile
};
