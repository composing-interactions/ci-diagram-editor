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
              } else {
	              let portID = Object.keys(node.ports)[0];
                  
                  if (portID) {
                  	if(nodes[node.id].ports[portID]) {
                    	if (node.ports[portID].label.length > 0) nodes[node.id].ports[portID].label = node.ports[portID].label;
                    	if (node.ports[portID].symbol.length > 0) nodes[node.id].ports[portID].symbol = node.ports[portID].symbol;
                    } else {
                  		nodes[node.id].ports[portID] = node.ports[portID];
                    }
                  }
              }
              
              //else if (Object.keys(node.ports) > 0) {
                //  let portID = Object.keys(node.ports)[0];
                  
                  //if(nodes[node.id].ports[portID]) {
                 //  	nodes[node.id].ports[portID] = {
                 //   	...nodes[node.id].ports[portID],
                 //   	...node.ports[portID]
                 //   };
                 // } else {
                 // 	nodes[node.id].ports[portID] = node.ports[portID];
                 // }
              //}
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
	= id:$[A-Za-z]+ symbol:([\[\{\(\\/])? label:$([A-Za-z ]+)? ([\]\}\)\\])? port:GraphPort? {
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
            	node.ports[port.id] = port;
            }
            
    		return node;
		}

GraphPort
	= "." id:$([A-Za-z]+) "["? symbol:$[~*#!]? label:$([A-Za-z ]+)? "]"? { return {id, label, symbol} }

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
