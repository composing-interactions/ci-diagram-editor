import ELK from 'elkjs';

const elk = new ELK();
const randomHex = (size) =>
	[...Array(size)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('');

class Mapper {
	constructor(data) {
		this.init();

		data.nodes.forEach((node) => {
			this.addNode(node);
		});

		data.edges.forEach((edge) => {
			this.addEdge(edge);
		});

		this.drawNodes();
	}

	init() {
		const wrapper = document.querySelector('.mapper');

		this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		this.svg.setAttribute('width', 500);
		this.svg.setAttribute('height', 500);
		this.svg.setAttribute('overflow', 'visible');
		this.svg.style.background = '#f00';

		wrapper.appendChild(this.svg);

		this.graph = {
			id: 'root',
			layoutOptions: {
				'elk.algorithm': 'layered',
				'spacing.portPort': 20,
			},
			children: [],
			edges: [],
		};
	}

	addNode(data) {
		this.graph.children.push({
			id: data.id,
			width: data.type == 'triangle' ? (Math.sqrt(3) * 150) / 2 : 150,
			height: 150,
			data,
			layoutOptions: {
				'portAlignment.default': 'CENTER',
				'spacing.portPort': 25,
			},
		});
	}

	addEdge(data) {
		this.graph.edges.push({
			id: randomHex(16),
			sources: [data.from],
			targets: [data.to],
			data,
		});
	}

	drawNodes() {
		elk
			.layout(this.graph)
			.then((data) => {
				console.log(data);
				data.children.forEach((node) => {
					const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

					let box;

					switch (node.data.type) {
						case 'dashed-square':
							box = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'rect'
							);

							box.setAttribute('width', node.width);
							box.setAttribute('height', node.height);
							box.setAttribute('fill', 'none');
							box.setAttribute('stroke', '#000');

							box.classList.add('dashed');
							break;

						case 'circle':
							box = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'ellipse'
							);

							box.setAttribute('rx', node.width / 2);
							box.setAttribute('ry', node.height / 2);
							box.setAttribute('cx', node.width / 2);
							box.setAttribute('cy', node.height / 2);
							box.setAttribute('fill', 'none');
							box.setAttribute('stroke', '#000');
							break;

						case 'triangle':
							box = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'polygon'
							);

							box.setAttribute(
								'points',
								`${0},${node.height / 2} ${node.width},0 ${node.width}, ${
									node.height
								}`
							);
							box.setAttribute('fill', 'none');
							box.setAttribute('stroke', '#000');

							break;

						default:
							box = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'rect'
							);

							box.setAttribute('width', node.width);
							box.setAttribute('height', node.height);
							box.setAttribute('fill', 'none');
							box.setAttribute('stroke', '#000');
							break;
					}

					const label = document.createElementNS(
						'http://www.w3.org/2000/svg',
						'text'
					);

					g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

					label.setAttribute('x', node.width / 2);
					label.setAttribute('y', node.height / 2);
					label.innerHTML = node.data.label;

					g.appendChild(box);
					g.appendChild(label);

					this.svg.appendChild(g);
				});

				data.edges.forEach((edge) => {
					edge.sections.forEach((section) => {
						let d = `M ${section.startPoint.x} ${section.startPoint.y}`;

						if (section.bendPoints) {
							section.bendPoints.forEach((point) => {
								d += ` L ${point.x} ${point.y}`;
							});
						}

						d += ` L ${section.endPoint.x} ${section.endPoint.y}`;

						const path = document.createElementNS(
							'http://www.w3.org/2000/svg',
							'path'
						);

						path.setAttribute('d', d);
						path.setAttribute('fill', 'none');
						path.setAttribute('stroke', '#000');

						this.svg.appendChild(path);
					});
				});
			})
			.catch(console.error);
	}
}

export default Mapper;
