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
				"\\sqrt"
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
				"\\overline",
				"\\triangle",
				"\\overrightarrow",
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
				"_",
				"^",
			]
		]
	}
]

class MQEdit {
	static load() {
		$("#document").html($("#document").html().replace(/$[\s\S]*?$/, 'formula!'));
	}
	static unload() {

	}
};

export {
	MQEdit
};
