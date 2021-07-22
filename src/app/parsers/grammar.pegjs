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
              if (!nodes[node.id]) nodes[node.id] = node;
          });

          command.edges.forEach(edge => {
              edges.push(edge);
          });
      });

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
            
            edge.from = a.id;
            edge.to = b.id;
            edges.push(edge);
        }
        
        return { nodes, edges };
    }
    
GraphNode
	= id:$[A-Za-z]+ symbol:([\[\{\(\\/])? label:$([A-Za-z ]+)? ([\]\}\)\\])? {
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
            
    		return {id, label, type}
		}
    
GraphEdge
	= symbol:$("="+ / "-"+ / "."+) ">" {
    		let type;
            
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
            
    		return {type}
        }
    
Direction
	= "TD" / "LR"
    
WS
	= [ \t]
    
_
	= WS+
    
NL = "\n"
