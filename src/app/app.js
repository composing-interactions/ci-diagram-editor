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
const error = document.querySelector('.error');
const output = document.querySelector('.output');
const highlighted = document.querySelector('.highlighted');
const defaultGraph = fs.readFileSync(
	`${__dirname}/../app/test/graphs/default.graph`,
	'utf-8'
);

let timeout = null;

function updateSVG() {
	const graphs = parser.parse(input.value);

	Promise.all(graphs.map((graph) => new Mapper(graph).render())).then(
		(svgs) => {
			[].slice
				.call(output.children)
				.forEach((child) => output.removeChild(child));

			svgs.forEach((svg) => {
				output.appendChild(svg);
			});
		}
	);
}

function highlight(text) {
	clearTimeout(timeout);

	try {
		highlighted.innerHTML = escapeHTML(highlighter.parse(text)).replace(
			/#####([^#]+)#####([^#]+)#####/g,
			'<span class="syntax-$1">$2</span>'
		);
		error.textContent = '';

		timeout = setTimeout(updateSVG, 1000);
	} catch (er) {
		highlighted.innerHTML = escapeHTML(text);

		error.textContent = er;
	}
}

input.textContent = defaultGraph;
highlight(defaultGraph);

function syncScroll() {
	highlighted.scrollTop = input.scrollTop;
}

input.addEventListener('scroll', syncScroll);

input.addEventListener('keydown', function (e) {
	if (e.key === 'Tab') {
		e.preventDefault();

		const start = this.selectionStart;
		const end = this.selectionEnd;

		this.value = `${this.value.substring(0, start)}\t${this.value.substring(
			end
		)}`;

		highlight(this.value);
		syncScroll();

		this.selectionStart = this.selectionEnd = start + 1;
	}
});

input.addEventListener('input', function (e) {
	if (this.value.charAt(this.value.length - 1) !== '\n') {
		this.value += '\n';
		this.selectionStart -= 1;
		this.selectionEnd = this.selectionStart;
	}

	highlight(this.value);
	syncScroll();
});
