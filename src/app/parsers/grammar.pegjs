Start
	= GraphList

GraphList
	= Graph+
    
Graph
	= "graph" _ dir:Direction NL body:GraphBody {
      const nodes = {};
      const edges = [];

      body.forEach(command => {
          command.nodes.forEach(node => {
              if (!nodes[node.id]) {
	              nodes[node.id] = node;
              }
              else {
	              nodes[node.id].ports = {...nodes[node.id].ports, ...node.ports}
              }
          });

          command.edges.forEach(edge => {
              edges.push(edge);
          });
      });
      
      Object.keys(nodes).map(n => nodes[n].ports = Object.values(nodes[n].ports).map(p => ({...p, id: n + "." + p.id})));

      return {
          direction: dir, nodes: Object.values(nodes), edges
      }
    }
    
GraphBody
	= GraphLine+

GraphLine
	= _ cmd:GraphCommand NL { return cmd }

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
	= id:$[A-Za-z]+ symbol:([\[\{\(\\/])? label:$([A-Za-z ]+)? ([\]\}\)\\])? port:$("."[A-Za-z ]+)? {
       		let type;
            
            switch(symbol) {
                case "{}".charAt(0):
                type = "dashed-square";
                break;
                
                case '(':
                type = "circle";
                break;
                
                case '/':
                type = "triangle";
                break;

				default:
                type = "square";
                break;
            }
            
            const node = {id, label, type, ports: {}};
            
            if (port) {
	            let id = port.substring(1);
            	node.ports[id] = {id, label: id};
            }
            
    		return node;
		}
    
GraphEdge
	= backward:"<"? symbol:$("="+ / "-"+ / "."+) forward:">"? {
    		let type;
            let direction;
            
            if (backward && forward) direction = 'both';
            else if (backward) direction = 'backward';
            else if (forward) direction = 'forward';
            else direction = 'none';
                       
            switch(symbol.charAt(0)) {
            	case '=':
                type = "normal";
                break;
                
                case '-':
                type = "dashed";
                break;
                
                case '.':
                type = "dotted";
                break;
            }
            
    		return {
            	type,
                direction
            }
        }
    
Direction
	= "TD" / "LR"
    
WS
	= [ \t]
    
_
	= WS+
    
NL = "\n"
