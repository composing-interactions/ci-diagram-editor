Start
	= GraphList

GraphList
	= Graph+
	
Graph
	// = "graph" _ dir:Direction NL body:GraphBody {
	= "graph" NL body:GraphBody {
		const nodes = {};
		const edges = [];
		const comments = [];

		body.forEach(command => {
			command.nodes.forEach(node => {
				if (!nodes[node.id]) {
					nodes[node.id] = node;
				} else {
					if (node.label.text.length > 0) {
						nodes[node.id].label = node.label;
						nodes[node.id].type = node.type;
					}

					let portID = Object.keys(node.ports)[0];
					
					if (portID) {
						if(nodes[node.id].ports[portID]) {
							if (node.ports[portID].label.length > 0) nodes[node.id].ports[portID].label = node.ports[portID].label;
							if (node.ports[portID].symbol == null) nodes[node.id].ports[portID].symbol = node.ports[portID].symbol;
						} else {
								nodes[node.id].ports[portID] = node.ports[portID];
						}
					}
				}
			});

			command.edges.forEach(edge => {
				edges.push(edge);
			});

			command.comments.forEach(comment => {
				if (comment) {
					comments.push({
						label: { text: comment, emphasis: false },
						from: command.nodes[0].id
					});
				}
			})
		});
		
		Object.keys(nodes).map(n => nodes[n].ports = Object.values(nodes[n].ports).map(p => ({...p, id: n + "." + p.id})));

		return {
			// direction: dir, 
			nodes: Object.values(nodes), edges, comments
		}
	}
	
GraphBody
	= GraphLine+

GraphLine
	= _ cmd:GraphCommand _* comment:GraphComment? NL+ { return {...cmd, comments: [comment]} }

GraphComment
	= "//" label:$AllowedCommentString { return label.trim() }

GraphCommand
	= a:GraphNode _* edge:GraphEdge? _* b:GraphNode? {
		const nodes = [a];
		const edges = [];
		
		if (edge && b) {
			nodes.push(b);
			
			let from = a.id;
			let to = b.id;
			
			let fromPorts = Object.keys(a.ports);
			let toPorts = Object.keys(b.ports);
			
			if (fromPorts.length > 0) {
				from += '.' + fromPorts[0];
				a.ports[fromPorts[0]].type = 'output';
			}
			
			if (toPorts.length > 0) {
				to += '.' + toPorts[0];
				b.ports[toPorts[0]].type = 'input';
			}
			
			edge.from = from;
			edge.to = to;
			edges.push(edge);
		}
		
		return { nodes, edges };
	}
	
GraphNode
	= id:$[A-Za-z]+ typeAndLabel:(GraphNodeTypeLabeled/GraphNodeTypeUnlabeled)? port:GraphPort? {
		let type = 'square';
		let label = { text: '', emphasis: false };

		if (typeAndLabel) {
			type = typeAndLabel.type;
			label = typeAndLabel.label;
		}
		
		const node = {id, label, type, ports: {}};
		
		if (port) {
			node.ports[port.id] = port;
		}
		
		return node;
	}

GraphNodeTypeLabeled
	= type:("(("/"("/"[["/"["/">>"/"<"/"{{"/"%") label:GraphNodeLabel secondType:("))"/")"/"]]"/"]"/">>"/"<"/"}}"/"%")& { return secondType === {
			'(': ')',
			'((': '))',
			'[': ']',
			'[[': ']]',
			// '>': '>',
			'>>': '>>',
			'<': '<',
			// '<<': '<<',
			// '{': '}',
			'{{': '}}',
			'%': '%',
		}[type] } { return { type: {
			'(': 'circle',
			'((': 'circle-dashed',
			'[': 'square',
			'[[': 'square-dashed',
			// '>': 'triangle-right',
			'>>': 'triangle-right-dashed',
			'<': 'triangle-left',
			// '<<': 'triangle-left-dashed',
			// '{': 'rhombus',						/*}   PEG.js balance curly braces */
			'{{': 'rhombus-dashed', 			/*}}  PEG.js balance curly braces */
			'%': 'arrow',
		}[type], label}}

GraphNodeLabel
	= emphasis:"!"? text:$(AllowedNodeString) { return { text: text.trim(), emphasis: emphasis ? true : false }}

GraphNodeTypeUnlabeled
	= type:("()"/"(())"/"[]"/"[[]]"/">>>>"/"<<"/"{{}}"/"%%") { return { type: {
			'()': 'circle',
			'(())': 'circle-dashed',
			'[]': 'square',
			'[[]]': 'square-dashed',
			// '>>': 'triangle-right',
			'>>>>': 'triangle-right-dashed',
			'<<': 'triangle-left',
			// '<<<<': 'triangle-left-dashed',
			// '{}': 'rhombus',
			'{{}}': 'rhombus-dashed',
			'%%': 'arrow',
		}[type], label: { text: '', emphasis: false }}}

GraphPort
	= "." isVertical:"^"? id:$([A-Za-z]+) labelAndSymbol:GraphPortLabel? {
    	const label = labelAndSymbol ? labelAndSymbol.label.trim() : '';
        const symbol = labelAndSymbol ? labelAndSymbol.symbol : null;
        
    	return {id, label, symbol, isVertical: isVertical ? true : false}
    }

GraphPortLabel
	= "[" symbol:GraphSymbol? label:$(AllowedPortString)? "]" {
    	return { symbol, label: label ? label : '' }
    }

GraphSymbol
	= "|" symbol:$[AVDEBSPTavdebspt] "|" { return symbol }

GraphEdge
	= fromSymbol:GraphSymbol? backward:"<"? typeAndLabel:(GraphEdgeSymbolLabeled/GraphEdgeSymbolUnlabeled) forward:">"? toSymbol:GraphSymbol? {
			let type;
			let direction;
			
			if (backward && forward) direction = 'both';
			else if (backward) direction = 'backward';
			else if (forward) direction = 'forward';
			else direction = 'none';
						 
			const symbols = [];

			return {
				type: typeAndLabel.type,
				label: typeAndLabel.label,
				symbols: [fromSymbol, toSymbol],
				direction
			}
		}

GraphEdgeSymbolLabeled
	= type:$("="+ / "-"+ / "*"+) label:$(AllowedEdgeString) secondType:$("="+ / "-"+ / "*"+)& { return type.charAt(0) === secondType.charAt(0) } { return {type: {'=': 'normal', '-': 'dashed', '*': 'dotted'}[type.charAt(0)], label: label}}

GraphEdgeSymbolUnlabeled
	= type:$("="+ / "-"+ / "*"+) { return {type: {'=': 'normal', '-': 'dashed', '*': 'dotted'}[type.charAt(0)], label: null}}

// Direction
// 	= "TD" / "LR"
AllowedEdgeString
	= [^=\-\*>\n]+

AllowedNodeString
	= [^\[\(\{\<\]\)\}\>\|%\n]+

AllowedPortString
	= [^\[\]\|\n]+

AllowedCommentString
	= [^\n]+

WS
	= [ \t]
	
_
	= WS+
	
NL = _* "\n"
