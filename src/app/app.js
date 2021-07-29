import peg from 'pegjs';
import fs from 'fs';
import Mapper from './lib/mapper';
import { escapeHTML } from './lib/lib';

//

const mainGrammar = fs.readFileSync(
	`${__dirname}/../app/parsers/grammar.pegjs`,
	'utf-8'
);

const highlightGrammar = fs.readFileSync(
	`${__dirname}/../app/parsers/highlight.pegjs`,
	'utf-8'
);

const parser = peg.generate(mainGrammar);
const highlighter = peg.generate(highlightGrammar);

//

const input = document.querySelector('.input');
const output = document.querySelector('.output');

input.addEventListener('keydown', function (e) {
	if (e.key === 'Tab') {
		e.preventDefault();

		const start = this.selectionStart;
		const end = this.selectionEnd;

		this.value = `${this.value.substring(0, start)}\t${this.value.substring(
			end
		)}`;

		this.selectionStart = this.selectionEnd = start + 1;
	}
});

//

const defaultGraph = fs.readFileSync(
	`${__dirname}/../app/test/graphs/default.graph`,
	'utf-8'
);

input.innerHTML = escapeHTML(highlighter.parse(defaultGraph)).replace(
	/#####([^#]+)#####([^#]+)#####/g,
	'<span class="syntax-$1">$2</span>'
);

// const graphs = parser.parse(defaultGraph);

// Promise.all(graphs.map((graph) => new Mapper(graph).render())).then((svgs) => {

// 	[].slice.call(output.children).forEach((child) => output.removeChild(child));

// 	svgs.forEach((svg) => {
// 		output.appendChild(svg);
// 	});
// });
