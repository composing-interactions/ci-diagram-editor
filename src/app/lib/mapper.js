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
const symbolPortMargin = 5;
const symbolEdgeMargin = 8;
const symbolNodeMargin = 8;

class Mapper {
	constructor(data) {
		this.init();

		data.nodes.forEach((node) => {
			this.addNode(node);
		});

		data.edges.forEach((edge) => {
			this.addEdge(edge);
		});

		data.comments.forEach((comment) => {
			this.addComment(comment);
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
				'spacing.portPort': 45,
				'spacing.edgeLabel': 15,
				'spacing.nodeSelfLoop': 30,
				'layered.edgeLabels.sideSelection': 'SMART_UP',
				'layered.spacing.baseValue': 60,
				'layered.wrapping.strategy': 'MULTI_EDGE',
				'layered.wrapping.additionalEdgeSpacing': 0,
				'layered.spacing.edgeEdgeBetweenLayers': 30,
				'layered.spacing.edgeNodeBetweenLayers': 30,
				'layered.wrapping.multiEdge.improveWrappedEdges': true,
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

	addComment(data) {
		const commentID = randomHex(16);

		this.graph.children.push({
			id: commentID,
			width: 143,
			height: 150,
			layoutOptions: {
				'elk.commentBox': true,
			},
			data: {
				type: 'comment',
				label: data.label,
			},
		});

		this.graph.edges.push({
			id: randomHex(16),
			sources: [data.from],
			targets: [commentID],
			data: {
				direction: 'none',
				symbols: [null, null],
				isComment: true,
			},
		});
	}

	addEdge(data) {
		this.graph.edges.push({
			id: randomHex(16),
			sources: [data.from],
			targets: [data.to],
			data,
			labels: data.label ? [{ text: data.label }] : null,
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
						case 'comment':
							box = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'path'
							);

							box.setAttribute(
								'd',
								`M142.8,98.2c-2.2,6.8-18.8,6.3-22.9,12c-4.2,5.7,1.4,21.3-4.3,25.5c-5.7,4.1-18.8-6-25.6-3.7c-6.6,2.1-11.2,18.1-18.5,18.1c-7.3,0-11.9-15.9-18.5-18.1c-6.8-2.2-19.9,7.9-25.6,3.7c-5.7-4.2-0.2-19.8-4.3-25.5c-4.1-5.7-20.7-5.2-22.9-12C-1.9,91.6,11.7,82.3,11.7,75c0-7.3-13.6-16.6-11.5-23.2c2.2-6.8,18.8-6.3,22.9-12c4.2-5.7-1.4-21.3,4.3-25.5c5.7-4.1,18.8,6,25.6,3.7C59.6,15.9,64.2,0,71.5,0C78.8,0,83.4,15.9,90,18.1c6.8,2.2,19.9-7.9,25.6-3.7c5.7,4.2,0.2,19.8,4.3,25.5c4.1,5.7,20.7,5.2,22.9,12c2.1,6.6-11.5,15.9-11.5,23.2C131.3,82.3,144.9,91.6,142.8,98.2z`
							);
							box.setAttribute('fill', 'none');
							box.setAttribute('x', 0);
							box.setAttribute('y', 0);
							box.setAttribute('stroke', '#000');
							break;

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

							if (port.data.symbol !== null) {
								extraMargin =
									port.data.type === 'input'
										? 15 + symbolPortMargin
										: -15 - symbolPortMargin;

								const symbol = document.createElementNS(
									'http://www.w3.org/2000/svg',
									'use'
								);

								let href;

								switch (port.data.symbol) {
									case 'D':
										href = 'portTypeDataStream';
										break;
									case 'P':
										href = 'portTypeParameter';
										break;
									case 'E':
										href = 'portTypeEnable';
										break;
									case 'T':
										href = 'portTypeTrigger';
										break;
									default:
										break;
								}

								symbol.setAttributeNS(
									'http://www.w3.org/1999/xlink',
									'xlink:href',
									`#${href}`
								);
								symbol.setAttribute('x', port.data.type === 'input' ? 0 : -15);
								symbol.setAttribute('y', -7.5);
								symbol.setAttribute('width', 15);
								symbol.setAttribute('height', 15);

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
					if (edge.data.isComment) return;

					const edgeGroup = document.createElementNS(
						'http://www.w3.org/2000/svg',
						'g'
					);

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
								path.setAttribute('marker-start', 'url(#arrowheadStart)');
								path.setAttribute('marker-end', 'url(#arrowheadEnd)');
								break;
							case 'backward':
								path.setAttribute('marker-start', 'url(#arrowheadStart)');
								break;
							case 'forward':
								path.setAttribute('marker-end', 'url(#arrowheadEnd)');
								break;
							default:
								break;
						}

						switch (edge.data.type) {
							case 'dashed':
								path.setAttribute('stroke-dasharray', '5px 10px 5px 0px');
								break;
							case 'dotted':
								path.setAttribute(
									'stroke-dasharray',
									'5px 10px 1px 9px 5px 0px'
								);
								break;
							default:
								break;
						}

						if (edge.data.symbols[0]) {
							const symbol = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'use'
							);

							let href;

							switch (edge.data.symbols[0]) {
								case 'A':
									href = 'edgeTypeAudio';
									break;
								case 'V':
									href = 'edgeTypeVideo';
									break;
								case 'D':
									href = 'edgeTypeDataStream';
									break;
								case 'E':
									href = 'edgeTypeEvent';
									break;
								case 'B':
									href = 'edgeTypeBuffer';
									break;
								case 'S':
									href = 'edgeTypeSpectral';
									break;
								default:
									break;
							}

							symbol.setAttributeNS(
								'http://www.w3.org/1999/xlink',
								'xlink:href',
								`#${href}`
							);
							symbol.setAttribute('x', section.startPoint.x + symbolNodeMargin);
							symbol.setAttribute(
								'y',
								section.startPoint.y - 15 - symbolEdgeMargin
							);
							// symbol.setAttribute('x', port.data.type === 'input' ? 0 : -30);
							// symbol.setAttribute('y', -15);
							symbol.setAttribute('width', 15);
							symbol.setAttribute('height', 15);

							edgeGroup.appendChild(symbol);
						}

						if (edge.data.symbols[1]) {
							const symbol = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'use'
							);

							let href;

							switch (edge.data.symbols[1]) {
								case 'A':
									href = 'edgeTypeAudio';
									break;
								case 'V':
									href = 'edgeTypeVideo';
									break;
								case 'D':
									href = 'edgeTypeDataStream';
									break;
								case 'E':
									href = 'edgeTypeEvent';
									break;
								case 'B':
									href = 'edgeTypeBuffer';
									break;
								case 'S':
									href = 'edgeTypeSpectral';
									break;
								default:
									break;
							}

							symbol.setAttributeNS(
								'http://www.w3.org/1999/xlink',
								'xlink:href',
								`#${href}`
							);
							symbol.setAttribute(
								'x',
								section.endPoint.x - 15 - symbolNodeMargin
							);
							symbol.setAttribute(
								'y',
								section.endPoint.y - 15 - symbolEdgeMargin
							);
							// symbol.setAttribute('x', port.data.type === 'input' ? 0 : -30);
							// symbol.setAttribute('y', -15);
							symbol.setAttribute('width', 15);
							symbol.setAttribute('height', 15);

							edgeGroup.appendChild(symbol);
						}

						edgeGroup.appendChild(path);
					});

					if (edge.labels) {
						console.log(edge);
						edge.labels.forEach((labelData) => {
							const label = document.createElementNS(
								'http://www.w3.org/2000/svg',
								'text'
							);

							label.setAttribute('x', labelData.x);
							label.setAttribute('y', labelData.y);
							label.innerHTML = labelData.text;
							label.classList.add('edge-label');

							edgeGroup.appendChild(label);
						});
					}

					this.container.appendChild(edgeGroup);
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
