Start
	= a:GraphList { return a }

GraphList
	= a:Graph+ { return a.join('') }
	
Graph
	= a:$"diagram" b:$NL c:GraphBody { return a + b + c }
	
GraphBody
	= a:GraphLine+ { return a.join('') }

GraphLine
	= a:$_ b:GraphCommand c:$_* d:GraphComment? e:$NL+ { return (a || '') + (b || '') + (c || '') + (d || '') + (e || '') }

GraphComment
	= a:$("//" AllowedCommentString) { return '#####comment#####' + a + '#####' }

GraphCommand
	= a:GraphNode b:$_* c:GraphEdge? d:$_* e:GraphNode? { return (a || '') + (b || '') + (c || '') + (d || '') + (e || '') }
	
GraphNode
	= a:$[A-Za-z]+ b:(GraphNodeTypeLabeled/GraphNodeTypeUnlabeled)? c:GraphPort? { return `#####node-id#####${a}#####` + (b ? `#####node-label#####${b}#####` : '') + (c || '')}

GraphNodeTypeLabeled
	= a:$("(("/"("/"[["/"["/">>"/"<"/"{{"/"%") b:GraphNodeLabel c:$("))"/")"/"]]"/"]"/">>"/"<"/"}}"/"%") { return a + b + c }

GraphNodeLabel
	= a:$"!"? b:$(AllowedNodeString) { return (a || '') + b}

GraphNodeTypeUnlabeled
	= a:$("()"/"(())"/"[]"/"[[]]"/">>>>"/"<<"/"{{}}"/"%%") {return a}

GraphPort
	= a:$"." b:$"^"? c:$([A-Za-z]+) d:GraphPortLabel? { return a + `#####port-id#####${b || ''}${c}#####` + (d ? `#####port-label#####${d}#####` : '')}

GraphPortLabel
	= a:$"[" b:$GraphSymbol? c:$(AllowedPortString)? d:$"]" { return a + (b || '') + (c || '') + d }

GraphSymbol
	= a:$"|" b:$[AVDEBSPTavdebspt] c:$"|" { return a + b + c }

GraphEdge
	= a:GraphSymbol? b:$"<"? c:(GraphEdgeSymbolLabeled/GraphEdgeSymbolUnlabeled) d:$">"? e:GraphSymbol? { return (a || '') + (b || '') + (c || '') + (d || '') + (e || '') }

GraphEdgeSymbolLabeled
	= a:$("="+ / "-"+ / "*"+) b:$(AllowedEdgeString) c:$("="+ / "-"+ / "*"+) { return (a || '') + (b || '') + (c || '') }

GraphEdgeSymbolUnlabeled
	= a:$("="+ / "-"+ / "*"+) { return (a || '') }

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
