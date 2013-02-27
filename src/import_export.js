//CSVdata has the format:
//v0,v1,...,vn
//i0,j0,e0
//11,j1,e1
//...
// where the first line is names of vertices
// and all following lines describe edges
//   v_i to v_j, with edge weight e
function import_from_CSV(CSVdata) {
    var data, vertices, edges;
    data = CSVdata.split('\n')
        .filter(function(line) { return line.length>0; })
        .map(function(line) {
            return line.split(',');
        }
    );
    vertices = data[0];
    edges = data.slice(1).map(function(e) {
        return [vertices[e[0]], vertices[e[1]], e[2]];
    });
    import_from_object({
        vertices: vertices || [],
        edges: edges || []
    });
}

function export_CSV() {
    var data = [];
    //vertices
    data.push( nodes.map(function(n) {
        return n.label;
    }) );
    //edges (with nonempty attributes)
    data = data.concat(
        edge_list.filter(function(e){ return e.label; })
        .map(function(e) {
            return [nodes.indexOf(e.node1), nodes.indexOf(e.node2), e.label];
        })
    );
    return data.map(function(d) { return d.join(','); }).join('\n');
}

//This format is compatible with sage
//JSONdata has the format:
//{"vertices" : [v0.label, v1.label, .... , vn.label],
//"edges" : [ [e0v0.label, e0v1label, edgelabel], ... ],
//"pos"" : [ [v0x, v0y], [v1x, v1y], ... ],
//"name" : "a_graph"
//}
function import_from_JSON(JSONdata) {
    var data;
    try {
        data = JSON.parse(JSONdata);
    } catch(e) {
        alert("Unable to parse.");
        return;
    }
    import_from_object(data);
}

function import_from_object(data) {
    var i, vertices = {}, new_v, pos, vertex;
    erase_graph();
    for (i = 0; i < data.vertices.length; i += 1) {
        new_v = new Vertex({x:0,y:0}, data.vertices[i]);
        vertices[data.vertices[i]] = new_v;
        nodes.push(new_v);
    }
	if (data.pos) {
        var maxx = -Infinity, minx = Infinity,
        maxy = -Infinity, miny = Infinity, newx, newy, dx, dy;
        for (i in data.pos) {
            maxx = Math.max(maxx, data.pos[i][0]);
            maxy = Math.max(maxy, data.pos[i][1]);
            minx = Math.min(minx, data.pos[i][0]);
            miny = Math.min(miny, data.pos[i][1]);
        }
        dx = maxx - minx;
        dy = maxy - miny;
        for (i in data.pos) {
            pos = data.pos[i];
            vertex = vertices[i];
            newx = (data.pos[i][0] - minx) / dx;
            newx = newx * 8 * SIZE.x / 10 + SIZE.x / 10;
            newy = (data.pos[i][1] - miny) / dy;
            newy = newy * 8 * SIZE.y / 10 + SIZE.y / 10;
            vertex.set_pos({x: newx, y: newy});
        }
	} else {
	    default_layout();
	}
    for (i = 0; i < data.edges.length; i += 1) {
        edge_list.push(new Edge(vertices[data.edges[i][0]], vertices[data.edges[i][1]], 1, data.edges[i][2]));
    }
    graph_name = data.name;
    draw();
}

function positions_dict() {
    var i, out, pos;
    out = "{";
    out += nodes.map(function(n,i) {
        var pos = n.get_pos();
        return i + ":[" + [pos.x, (SIZE.y - pos.y)].join(',') + "]";
    }).join(',');
    return out + "}";
}

function adjacency_lists_dict() {
    var edge, empty, i, j, node, out;
    out = "{";
    out += nodes.map( function(node,i) {
        return i + ":[" + edge_list.map(function(e) {
            var enodes = e.get_nodes();
            if (enodes.node1 === node) {
                return nodes.indexOf(enodes.node2);
            }
            if (enodes.node2 === node) {
                return nodes.indexOf(enodes.node1);
            }
            }).filter(nonundef).join(',')+']';
            // add filter i>j to only get neighbors with smaller index. which was the old functionality.
        });
    return out + "}";
}

function export_tkz() {
    var pos, edge, i, j, out, px2pt;
    px2pt = 0.75;
    out = "% uses the tkz-brege package\n";
    out += "\\begin{tikzpicture}\n\n";
    for (i = 0; i<nodes.length; i++) {
        out += "\\Vertex";
        pos = nodes[i].get_pos();
        out += "[x=" + px2pt*pos.x + "pt,y=" + px2pt*(SIZE.y-pos.y) + "pt]";
        out += "{" + i + "};\n";
    }
    out += "\n";
    for (j = 0; j<edge_list.length; j++){
        out += "\\Edge";
        edge = edge_list[j].get_nodes();
        out += "("+nodes.indexOf(edge.node1)+")";
        out += "("+nodes.indexOf(edge.node2)+")";
        out += "\n";
    }
    out+="\n";
    out+="\\end{tikzpicture}\n";
    return out;
}

function export_sage() {
    var data = {}, pos, i, exec = '';
    data.vertices = nodes.map(function(n) {
        return n.label;
    });
    data.edges = edge_list.map(function(e) {
        return [e.node1.label, e.node2.label, e.label];
    });
    data.pos = {};
    for (i = 0; i < nodes.length; i++) {
        pos = nodes[i].get_pos();
        data.pos[nodes[i].label] = [pos.x, pos.y];
    }
    data.name = graph_name;
    return JSON.stringify(data);
}
