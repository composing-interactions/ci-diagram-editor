import ELK from 'elkjs';
import fs from 'fs';

const styleDef = fs.readFileSync(`${__dirname}/../css/graph.css`, 'utf-8');
const svgDefs = fs.readFileSync(`${__dirname}/../svg/defs.svg`, 'utf-8');

const elk = new ELK();
const randomHex = (size) =>
	[...Array(size)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join('');

const margin = 25;
const edgeMargin = 10;
const portMargin = 10;
const symbolMargin = 5;
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

		wrapper.appendChild(this.svg);

		const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		defs.innerHTML = svgDefs;

		this.svg.appendChild(defs);

		const style = document.createElement('style');
		style.innerHTML = styleDef;

		this.svg.appendChild(style);

		this.container = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'g'
		);
		this.svg.appendChild(this.container);

		this.graph = {
			id: 'root',
			layoutOptions: {
				'layered.nodePlacement.favorStraightEdges': true,
				'elk.algorithm': 'layered',
				'spacing.nodeNode': 60,
				'spacing.edgeNode': 30,
				'spacing.edgeEdge': 30,
				'spacing.portPort': 30,
				'elk.aspectRatio': 1,
				'layered.spacing.baseValue': 140,
				'layered.feedbackEdges': true,
				'elk.padding': '[top=0,left=0,right=0,bottom=0]',
				'spacing.portsSurrounding': '[top=30,left=0,right=0,bottom=30]',
			},
			children: [],
			edges: [],
		};
	}

	addNode(data) {
		const ports = data.ports.map((port) => ({
			id: port.id,
			width: 0,
			height: 0,
			properties: {
				side: port.type === 'input' ? 'WEST' : 'EAST',
			},
			data: port,
		}));

		this.graph.children.push({
			id: data.id,
			width: data.type == 'triangle' ? (Math.sqrt(3) * 150) / 2 : 150,
			height: 150,
			data,
			layoutOptions: {
				'portAlignment.default':
					data.type === 'circle' || data.type === 'triangle'
						? 'CENTER'
						: 'JUSTIFIED',
				portConstraints: 'FIXED_SIDE',
			},
			ports,
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
							box.setAttribute('stroke-dasharray', '53px 44px 53px 0px');

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

					if (node.ports) {
						node.ports.forEach((port) => {
							const portGroup = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'g'
							);

							const portLabel = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'text'
							);

							let extraMargin = 0;

							if (port.data.symbol !== '') {
								extraMargin =
									port.data.type === 'input'
										? 30 + symbolMargin
										: -30 - symbolMargin;

								const symbol = document.createElementNS(
									'http://www.w3.org/2000/svg',
									'use'
								);

								let href;

								switch (port.data.symbol) {
									case '~':
										href = 'data';
										break;
									case '*':
										href = 'parameter';
										break;
									case '#':
										href = 'enable';
										break;
									case '!':
										href = 'trigger';
										break;
									default:
										break;
								}

								symbol.setAttributeNS(
									'http://www.w3.org/1999/xlink',
									'xlink:href',
									`#${href}`
								);
								symbol.setAttribute('x', port.data.type === 'input' ? 0 : -30);
								symbol.setAttribute('y', -15);
								symbol.setAttribute('width', 30);
								symbol.setAttribute('height', 30);

								portGroup.appendChild(symbol);
							}

							portGroup.setAttribute(
								'transform',
								`translate(${
									port.x +
									(port.data.type === 'input' ? portMargin : -portMargin)
								},${port.y})`
							);

							portLabel.innerHTML = port.data.label;
							portLabel.setAttribute('x', extraMargin);

							portLabel.classList.add('port-label');
							portLabel.classList.add(
								port.data.type === 'input' ? 'port-input' : 'port-output'
							);

							portGroup.appendChild(portLabel);
							g.appendChild(portGroup);
						});
					}

					const label = document.createElementNS(
						'http://www.w3.org/2000/svg',
						'text'
					);

					g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

					label.setAttribute('x', node.width / 2);
					label.setAttribute('y', node.height / 2);
					label.innerHTML = node.data.label;
					label.classList.add('node-label');

					g.appendChild(box);
					g.appendChild(label);

					this.container.appendChild(g);
				});

				data.edges.forEach((edge) => {
					edge.sections.forEach((section) => {
						const secondPoint = section.bendPoints
							? section.bendPoints[0]
							: section.endPoint;

						const secondToLastPoint = section.bendPoints
							? section.bendPoints[section.bendPoints.length - 1]
							: section.startPoint;

						const startVector = {
							x: secondPoint.x - section.startPoint.x,
							y: secondPoint.y - section.startPoint.y,
						};

						const startVectorLength = Math.sqrt(
							startVector.x * startVector.x + startVector.y * startVector.y
						);

						startVector.x *= edgeMargin / startVectorLength;
						startVector.y *= edgeMargin / startVectorLength;

						const endVector = {
							x: section.endPoint.x - secondToLastPoint.x,
							y: section.endPoint.y - secondToLastPoint.y,
						};

						const endVectorLength = Math.sqrt(
							endVector.x * endVector.x + endVector.y * endVector.y
						);

						endVector.x *= edgeMargin / endVectorLength;
						endVector.y *= edgeMargin / endVectorLength;

						let d = `M ${section.startPoint.x + startVector.x} ${
							section.startPoint.y + startVector.y
						}`;

						if (section.bendPoints) {
							section.bendPoints.forEach((point) => {
								d += ` L ${point.x} ${point.y}`;
							});
						}

						d += ` L ${section.endPoint.x - endVector.x} ${
							section.endPoint.y - endVector.y
						}`;

						const path = document.createElementNS(
							'http://www.w3.org/2000/svg',
							'path'
						);

						path.setAttribute('d', d);
						path.setAttribute('fill', 'none');
						path.setAttribute('stroke', '#000');

						switch (edge.data.direction) {
							case 'both':
								path.setAttribute('marker-start', 'url(#arrowhead-start)');
								path.setAttribute('marker-end', 'url(#arrowhead-end)');
								break;
							case 'backward':
								path.setAttribute('marker-start', 'url(#arrowhead-start)');
								break;
							case 'forward':
								path.setAttribute('marker-end', 'url(#arrowhead-end)');
								break;
							default:
								break;
						}

						switch (edge.data.type) {
							case 'dotted':
								path.setAttribute('stroke-dasharray', '5px 10px 5px 0px');
								break;
							case 'dashed':
								path.setAttribute(
									'stroke-dasharray',
									'5px 10px 1px 9px 5px 0px'
								);
								break;
							default:
								break;
						}

						this.container.appendChild(path);
					});
				});

				const bbox = this.container.getBBox();

				this.svg.setAttribute('width', bbox.width + margin * 2);
				this.svg.setAttribute('height', bbox.height + margin * 2);

				this.container.setAttribute(
					'transform',
					`translate(${margin}, ${margin})`
				);
			})
			.catch(console.error);
	}
}

export default Mapper;
