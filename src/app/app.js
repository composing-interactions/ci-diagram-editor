import peg from 'pegjs';
import fs from 'fs';
import JSZip from 'jszip';
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

const editor = document.querySelector('.editor');
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

function saveToMemory(text) {
	window.localStorage.setItem('text', text);
}

function highlight(text) {
	clearTimeout(timeout);

	try {
		highlighted.innerHTML = `${escapeHTML(highlighter.parse(text)).replace(
			/#####([^#]+)#####([^#]+)#####/g,
			'<span class="syntax-$1">$2</span>'
		)}&nbsp;`;
		error.textContent = '';

		timeout = setTimeout(updateSVG, 1000);
	} catch (er) {
		highlighted.innerHTML = `${escapeHTML(text)}&nbsp;`;

		error.textContent = er;
	}

	saveToMemory(text);
}

const memoryText = window.localStorage.getItem('text');

if (!memoryText || memoryText.length < 1) {
	input.textContent = defaultGraph;
	highlight(defaultGraph);
} else {
	input.textContent = memoryText;
	highlight(memoryText);
}

const documentationOpen = window.localStorage.getItem('documentation-open');

if (documentationOpen === 'false')
	editor.classList.remove('documentation-open');

if (!memoryText || memoryText.length < 1) {
	input.textContent = defaultGraph;
	highlight(defaultGraph);
} else {
	input.textContent = memoryText;
	highlight(memoryText);
}

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

document.querySelector('.save-input').addEventListener('click', (e) => {
	const element = document.createElement('a');
	element.setAttribute(
		'href',
		`data:text/plain;charset=utf-8,${encodeURIComponent(input.value)}`
	);
	element.setAttribute(
		'download',
		`Diagram ${new Date()
			.toISOString()
			.split('Z')[0]
			.split('.')[0]
			.replace('T', ' at ')
			.replace(/:/g, '.')}.diagram`
	);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
});

document.querySelector('.save-output').addEventListener('click', (e) => {
	const zip = new JSZip();
	const name = `Diagrams ${new Date()
		.toISOString()
		.split('Z')[0]
		.split('.')[0]
		.replace('T', ' at ')
		.replace(/:/g, '.')}`;

	const folder = zip.folder(name);

	[].slice.call(output.querySelectorAll('svg')).forEach((svg, i) => {
		folder.file(`Diagram ${i + 1}.svg`, `${svg.outerHTML}\n`);
	});

	zip.generateAsync({ type: 'base64' }).then((base64) => {
		const element = document.createElement('a');
		element.setAttribute(
			'href',
			`data:application/zip;base64,${encodeURIComponent(base64)}`
		);

		element.setAttribute('download', `${name}.zip`);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	});
});

document
	.querySelector('.toggle-documentation')
	.addEventListener('click', () => {
		if (editor.classList.contains('documentation-open')) {
			editor.classList.remove('documentation-open');
			window.localStorage.setItem('documentation-open', false);
		} else {
			editor.classList.add('documentation-open');
			window.localStorage.setItem('documentation-open', true);
		}
	});
