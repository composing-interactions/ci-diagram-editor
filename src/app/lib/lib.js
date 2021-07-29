export function wrapLines(text, width, css) {
	const container = document.createElement('div');

	const element = document.createElement('div');
	element.style.width = `${width}px`;
	element.style.position = 'absolute';
	element.style.left = '0';
	element.style.top = '0';
	element.id = 'wrap-lines-element';

	const style = document.createElement('style');
	style.innerHTML = `
		#wrap-lines-element {
			${css}
		}
	`;
	container.appendChild(style);

	container.appendChild(element);

	document.body.appendChild(container);

	const lines = [];
	let currentLine = [];
	const words = text.split(' ');
	let pHeight = 0;
	let lineHeight = 0;

	for (let i = 0; i < words.length; i++) {
		const currentLines = lines.map((line) => line.join(' '));
		const currentLineCopy = [...currentLine, words[i]].join(' ');
		currentLines.push(currentLineCopy);

		element.innerHTML = currentLines.join(' ');

		const height = element.clientHeight;

		if (i !== 0 && height !== pHeight) {
			lines.push(currentLine);
			currentLine = [];

			lineHeight = height - pHeight;
		}

		currentLine.push(words[i]);
		pHeight = height;
	}

	lines.push(currentLine);

	document.body.removeChild(container);

	return { lines: lines.map((line) => line.join(' ')), lineHeight };
}

export function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
