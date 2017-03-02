var enteredMath;
var answerMathField;

var eqConfig = [{
		label: "Greek Letters",
		latex: [
			[
				"\\alpha",
				"\\beta",
				"\\gamma",
				"\\delta",
				"\\epsilon",
				"\\zeta",
				"\\eta",
				"\\theta",
				"\\lambda",
				"\\mu",
				"\\Gamma",
				"\\Delta",
				"\\Theta",
				"\\Lambda"
			]
		]
	}, {
		label: "Relation Operators",
		latex: [
			[
				"<",
				">",
				"\\leq",
				"\\geq",
				"\\subset",
				"\\supset",
				"\\not\\subset",
				"\\not\\supset",
				"\\subseteq",
				"\\supseteq",
				"\\nsubseteq",
				"\\nsupseteq"
			],
			[
				"\\in",
				"\\ni",
				"\\notin",
				"=",
				"\\approx",
				"\\cong",
				"\\sim",
				"\\neq",
				"\\parallel",
				"\\nparallel",
				"\\smile",
				"\\frown",
				"\\perp",
				"\\mid"
			]
		]
	},
	{
		label: "Unary and Binary Operators",
		latex: [
			[
				"+",
				"-",
				"\\neg",
				"\\pm",
				"\\mp",
				"\\times",
				"\\div",
				"\\ast",
				"\\cdot",
				"\\cup",
				"\\cap",
				"\\setminus",
				"\\sqrt{x}"
			]
		]
	},
	{
		label: "Logic",
		latex: [
			[
				"\\exists",
				"\\exists!",
				"\\not\\exists",
				"\\forall",
				"\\neg",
				"\\lor",
				"\\land",
				"\\Rightarrow",
				"\\Leftarrow",
				"\\Leftrightarrow",
				"\\top",
				"\\bot",
				"\\Longrightarrow",
				"\\Longleftarrow"
			]
		]
	},
	{
		label: "Geometry",
		latex: [
			[
				"\\overline{x}",
				"\\triangle",
				"\\overrightarrow{x}",
				"\\cong",
				"\\sim",
				"\\parallel",
				"\\nparallel",
				"\\perp",
				"\\not\\perp",
				"\\angle",
				"\\measuredangle",
				"\\square"
			]
		]
	},
	{
		label: "Arrows",
		latex: [
			[
				"\\rightarrow",
				"\\leftarrow",
				"\\mapsto",
				"\\uparrow",
				"\\downarrow",
				"\\updownarrow",
				"\\Uparrow",
				"\\Downarrow",
				"\\Updownarrow",
				"\\Rightarrow",
				"\\Leftarrow",
				"\\Leftrightarrow",
				"\\Longrightarrow",
				"\\Longleftarrow"
			]
		]
	},
	{
		label: "Functions",
		latex: [
			[
				"\\sin",
				"\\cos",
				"\\tan",
				"\\sec",
				"\\csc",
				"\\cot",
				"\\log",
				"\\ln",
				"\\sum_x^x",
				"\\int",
				"\\prod_x^x",
				"\\coprod_x^x",
				"\\lim",
				"\\infty"
			]
		]
	},
	/*{
		label: "Set Notation",
		latex: [
			[
				"\\N",
				"\\Z",
				"\\Q",
				"\\R",
				"\\C"
			]
		]
	},*/
	{
		label: "Other",
		latex: [
			[
				"{x}_{x}",
				"{x}^{x}",
			]
		]
	}
]

class MQEdit {
	static init() {
		let table = $("#mq-table-body");
		let row = $(`<tr><div class="btn-group btn-group-lg btn-group-justified btn-group-fill-height"></div></tr>`).appendTo(table);
		eqConfig.forEach((section) => {
			section.latex.forEach((group) => {
				group.forEach((item) => {
					let col = $(`<button class="btn btn-default mq-button" data-formula="${item.replace(/\{[a-z]\}|\_[a-z]|\^[a-z]|\{|\}/gi, "")}"><span>${item}</span></button>`).appendTo(row);
					col.click(function() {
						answerMathField.cmd($(this).attr("data-formula"));
						answerMathField.focus();
					});
					MQ.StaticMath(col.children()[0]);
				});
			});
		});
	}
	static load() {
		answerMathField = MQ.MathField($("#mq-edit-field")[0], {
			handlers: {
				edit: function() {
					enteredMath = answerMathField.latex();
					$(".mq-active").attr("data-formula", enteredMath);
					$(".mq-active").html(enteredMath);
					MQ.StaticMath($(".mq-active")[0]);
				}
			}
		});

		while (findStringBetween($("#document").html(), ":fs:", ":fe:")) {
			$("#document").html($("#document").html().replace(findStringBetween($("#document").html(), ":fs:", ":fe:")[0],
				`<span class="mq">
					${findStringBetween($("#document").html(), ":fs:", ":fe:")[0].replace(/:fs:|:fe:/g, "")}
				</span><span>&nbsp;</span>`
			));
		}

		initTinyMCE();

		$(".mq").each(function() {
			$(this).attr("data-formula", $(this).text());
			MQ.StaticMath($(this)[0]);
		});

		loadListeners();
	}
	static unload() {
		$(".mq").each(function() {
			$(this)[0].outerHTML = `:fs:${$(this).attr("data-formula")}:fe:`;
		});
	}
	static insert() {
		tinymce.activeEditor.execCommand('mceInsertRawHTML', false,
			`<span class="mq" id="mq-new" data-formula=""></span><span>&nbsp;</span>`);
		window.setTimeout(function() {
			loadListeners();
			$("#mq-new").click();
			$("#mq-new").attr("id", "");
		}, 1);
	}
};

function loadListeners() {
	$("#document").on("click", function() {
		$(".mq").removeClass("mq-active");
		$("#mq-editor").attr("class", "");
		answerMathField.latex("");
	});

	$(".mq").on("click", function(e) {
		e.stopPropagation();
		$(".mq").removeClass("mq-active");
		$(this).addClass("mq-active");
		$("#mq-editor").attr("class", "mq-field-active");
		answerMathField.latex($(this).attr("data-formula"));
		answerMathField.focus();
	});
}

function findStringBetween(str, first, last) {
	var r = new RegExp(first + '(.*?)' + last, 'gm');
	return str.match(r);
}

export {
	MQEdit
};
