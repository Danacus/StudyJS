var util = {
	extractColor: function(url) {
		var col = url.split("/")[url.split("/").length - 1];
		var colors = {
			colors: []
		};

		var colSplit = col.split("-");

		for (var i = 0; i < colSplit.length; i++) {
			colors.colors.push("#" + colSplit[i]);
		}

		console.log(colors);
		return JSON.stringify(colors);
	}
}
