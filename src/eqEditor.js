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
				"\\leqslant",
				"\\geqslant",
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
				"\\#",
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
				"\\sqrt{}"
			]
		]
	},
	{
		label: "Logic",
		latex: [
			[
				"\\exists",
				"\\exists!",
				"\\nexists",
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
				"\\overline{}",
				"\\triangle",
				"\\overrightarrow{}",
				"\\cong",
				"\\ncong",
				"\\sim",
				"\\nsim",
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
				"\\sum",
				"\\int",
				"\\prod",
				"\\coprod",
				"\\lim",
				"\\infty"
			]
		]
	},
	{
		label: "Other",
		latex: [
			[
				"_{x}",
				"^{x}",
			]
		]
	}
]


class MQEdit {
	constructor() {
		eqConfig.forEach(function(current) {
			var button = $('<a href="#" class="list-group-item" data-parent="#menu">' + current.label + '</a>').appendTo("#eq-panel");
			var table = $('<div class="sublinks collapse"><table class="table"><tbody></tbody></table></div>').insertAfter(button);
			button.click(function() {
				$(this).next().collapse("toggle");
			});

			console.log(current.latex);

			current.latex.forEach(function(lat) {
				var tr = $("<tr></tr>").appendTo(table.find("tbody").first());
				lat.forEach(function(l) {
					var td = $('<td><button data-text="' + l + '" type="button" class="btn btn-default">$' + l + '$</button></td>').appendTo(tr);
					td.children("button").first().click(function() {
						//answerMathField.typedText($(this).data("text").replace("$", "") + " ");
						answerMathField.latex(answerMathField.latex() + $(this).data("text").replace("$", ""));
					});
				})
			})
		})
	}
	open() {
		console.log("open");
		var answerSpan = document.getElementById('eq-field');
		answerMathField = MQ.MathField(answerSpan, {
			handlers: {
				edit: function() {
					enteredMath = answerMathField.latex();
					//$("#eq-latex").text(enteredMath); // Get entered math in LaTeX format
				}
			}
		});
		answerMathField.latex("");
		enteredMath = answerMathField.latex();
	}
	close() {
		$("#eq-editor").modal("hide");
	}
	insert() {
		console.log(enteredMath);
		tinymce.activeEditor.execCommand('mceInsertRawHTML', false, "<span class='eq-math' data-formula='$" + enteredMath + "$'>$" + enteredMath + "$</span><span>&nbsp;</span>");
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		$("#eq-editor").modal("hide");
	}
};

export {
	MQEdit
};
