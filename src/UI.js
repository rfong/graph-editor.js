function add_checkbox(name, variable, container_id, onclickf) {
    var s ='<tr>';
    s +='<td><input type="checkbox"'; //+' id="'+name+'_check"'
    s +=' value="'+variable+'"';
    if (variable){
        s+='checked';
    }
    s += '/></td>';
    s += '<td>'+name+'</td>';
    s += '</tr>';
    $(container_id).append(s);
    $(container_id+' input[type=checkbox]:last').click(onclickf);
}

function add_button(name, container_id, onclickf) {
    var s ='<input type="button" id="'+name+'_button" value="'+name+'"';
s += '/>';
    $(container_id).append(s);
    $(container_id+' input:last').click(onclickf);
}

function add_slider(name, variable, container_id, min, max, onchangef) {
    var s = '<tr><td>'+name+'</td>';
    s += '<td><div class="slider"></div></td></tr>';
    $(container_id).append(s);
    $(container_id+' div.slider:last').slider({
        min: min,
        max: max,
        value: variable,
        slide: function (event, ui) {
            onchangef(ui.value);
        }
    });
}

function create_controls(div) {
    //Create controls and attach click functions
    var menu, canvaspos = $(div +' canvas').offset(), buttondiv = div + ' #graph_editor_button_container',
    canvas = $(div +' canvas')[0];
    $(div).prepend('<div id="graph_editor_button_container"></div>');
    $('<div id="live_button" class="graph_editor_button">live</div>').appendTo(buttondiv).click(toggle_live);
    $('<div id="menu_button" class="graph_editor_button menu_button">menu</div>').appendTo(buttondiv)
    .toggle(function() {
        $(div).animate({'width': SIZE.x + 330 + 'px'},
            {queue: true, duration: 'fast', easing: 'linear', complete: function (){
                $(div + ' #graph_editor_menu').slideToggle('fast');
                MENU = true;
            }
        });
        $(div+' #menu_button').toggleClass('graph_editor_button_on');
    },
    function() {
        $(div + ' #graph_editor_menu').slideToggle('fast', function (){
            $(div).animate({'width': SIZE.x +'px'},
            {queue: true, duration: 'fast', easing: 'linear'});
            MENU = undefined;
        });
        $(div+' #menu_button').toggleClass('graph_editor_button_on');
    })
    .each(function() { if (MENU) $(this).click(); });

    /*$('<div id="undo_button" class="graph_editor_button">undo</div>').appendTo(buttondiv)
    .click(undo_remove).toggleClass('graph_editor_undo_disabled');
    */
    $('<div id="reset_button" class="graph_editor_button">reset</div>').appendTo(buttondiv)
    .click(function() {
        if (confirm("The graph will be irreversibly erased. This operation cannot be undone.")) {
            erase_graph();
        }
    });

    $('<div id="help_button" class="graph_editor_button">?</div>').appendTo(buttondiv)
    .click(function() {
        $('#help_dialog').dialog('open');
    });

    $(div).append('<div id="graph_editor_menu"></div>');
    render_menu(div);

    $(div).append("<div id='help_dialog'>\
        <p>Vertices cannot be created or deleted using the graphical editor for this application.\
        <table>\
            <tr><td>unselect object</td><td>Press escape.</td></tr>\
            <tr><td>delete object</td><td>Press delete when the object is selected.</td></tr>\
            <tr><td>create/erase edge</td><td>Select the first vertex. Click on another vertex (different than the selected one) to turn on/off (toggle) the edge between them.</td></tr>\
            <tr><td>increase/decrease multiplicity</td><td>Use +/-. When multiplicity is 0 the edge disappears.</td></tr>\
            <tr><td>keep the selected vertex after edge toggle</td><td>Hold 'SHIFT' to preserve the selected vertex after creating/erasing an edge.</td></tr>\
            <tr><td>split an edge</td><td>press 's' when edge is selected.</td></tr>\
            <tr><td>freeze a vertex</td><td>pressing 'r' freezes the selected vertex (it will not move in live mode)</td></tr>\
            <tr><td>add/remove loop</td><td>press 'o'</td></tr>\
            <tr><td>turn on realtime spring-charge model</td><td>Press 'l' or click on the live checkbox.</td></tr>\
        </table>\
        </div>");
    $('#help_dialog').dialog({
        autoOpen : false,
        width : 700,
        title : "Graph Editor Help",
        modal : true
    });
}

function render_menu(div) {
    if (!MENU) return;
    menu = div+' #graph_editor_menu';
    $(menu).html('');

    // info
    $(menu).append("<div class='infobox'><h4 id='title'>Info</h4>\
    <div id='info'>Index: <span id='index'></span><br>\
    <span id='pos'>Position: (<span id='posx'></span>, <span id='posy'></span>)<br></span>\
    <span id='vert'>Vertices: <span id='v1'></span>, <span id='v2'></span><br></span>\
    <span id='label-container'>Label: <span id='label-plain'></span><input type='text' id='label'></span></div>\
    <div id='none_selected'>No node is selected</div></div>");
    $(div + ' .infobox #info').hide();
    $(div + ' .infobox #label').keyup(function(e) {
        var index = $(div + ' .infobox #index').html(),
        title = $(div + ' .infobox #title').html(),
        val = $(div + ' .infobox #label').val();
        if (title === "Vertex Info"){
            nodes[index].label = val;
            if (!MODIFIABLE_NODES) { // in case of sneaks
                e.preventDefault();
                return;
            }
        } else if (title === "Edge Info"){
            if (!NUMERIC_EDGES || isNumber(val) || val=='-') {
                edge_list[index].label = val;
            }
            else {
                alert("Not a number!");
            }
        }
    });

    // menu
    $(menu).append("<h4>Tweaks</h4>");
    add_button('Circular layout', menu, function() {
        if (confirm("All vertices will be irrevesably moved. This operation cannot be undone.")) {
            circular_layout();
        }
    });

    add_button('Grid layout', menu, function() {
        if (confirm("All vertices will be irrevesably moved. This operation cannot be undone.")) {
            grid_layout();
        }
    });

    $(menu).append('<table>');
/*
    add_checkbox('Edge labels', EDGE_LABELS, menu, function() {
        EDGE_LABELS = !EDGE_LABELS;
        draw();
        });

    add_checkbox('Vertex labels', NODE_NUMBERS, menu, function() {
        NODE_NUMBERS = !NODE_NUMBERS;
        draw();
        });

    add_checkbox('Numeric edges', NUMERIC_EDGES, menu, function(e) {
        if (NUMERIC_EDGES || confirm("Any non-numeric edge labels will be deleted. This operation cannot be undone.")) {
            NUMERIC_EDGES = !NUMERIC_EDGES;
            draw();
        }
        else
            e.preventDefault();
        });

    add_checkbox('Modifiable vertices', MODIFIABLE_NODES, menu, function() {
        MODIFIABLE_NODES = !MODIFIABLE_NODES;
        draw();
        if ($('.infobox #title').html() == 'Vertex Info')
            update_infobox_label(div);
        });
*/
    add_checkbox('Info on mouseover', MOUSEOVER_INFO, menu, function() {
        MOUSEOVER_INFO = !MOUSEOVER_INFO;
        draw();
        });

    add_checkbox('Default edge values '
                +'<input type="text" value="'+DEFAULT_EDGE+'" size="5" />',
                AUTO_EDGES, menu, function() {
        AUTO_EDGES = !AUTO_EDGES;
        draw();
        });
    $(menu+' td:last input[type=text]').keyup(function() {
        if (NUMERIC_EDGES && !isNumber($(this).val())) {
            alert('Not a number');
            $(this).val('');
        }
        else
            DEFAULT_EDGE = $(this).val();
    });

    $(menu).append('</table><table>');

    /*add_slider('Font Size', FONT_SIZE, menu, 10, 19, function(newval) {
        FONT_SIZE = newval;
        draw();
        });
    */
    add_slider('Vertex Size', NODE_RADIUS, menu, 0, 30, function(newval) {
        NODE_RADIUS = newval;
        draw();
        });

    add_slider('Orientation', 0, menu, 0, 360, change_orientation);
    $(menu).append('</table>').hide();

    add_slider('Edge Strength', 50, menu, 0, 100, function(newval) {
        SPRING = (1 - 1e-2) + 1e-4 * (100 - newval);
        SPEED = newval / 50.0;
        SPEED *= 2 * SPEED;
    });
    add_slider('Edge Length', FIXED_LENGTH, menu, 20, 500, function (newval){
        FIXED_LENGTH = newval;
    });

    // import / export
    $(menu).append("<h4>Import / Export</h4>");
    $(menu).append('<div id="io_buttons">');
    /*
    add_button('Import JSON', menu+' #io_buttons', function() {
        import_from_JSON($(div+' #json').val());
    });
    add_button('Export JSON', menu+' #io_buttons', function() {
        $(div+' #json').val(export_sage());
    });
    $(menu+' #io_buttons').append('<br>');
    */
    add_button('Import CSV', menu+' #io_buttons', function() {
        import_from_CSV($(div+' #json').val());
    });
    add_button('Export CSV', menu+' #io_buttons', function() {
        $(div+' #json').val(export_CSV());
    });
    $(menu+' #io_buttons').append('<br>');
    add_button('Export Latex', menu+' #io_buttons', function() {
        $(div+' #json').val(export_tkz());
    });
    add_button('Export image', menu+' #io_buttons', function() {
        var canvas = $(div +' canvas')[0];
        var img = canvas.toDataURL("image/png");
        window.open(img, "Graph Editor Image"
        ,"menubar=false,toolbar=false,location=false,width="
        + SIZE.x + ",height=" + SIZE.y);
    });
    $(menu).append('<textarea id="json" rows="5" cols="34"></textarea><br>');
}

function update_infobox_label(div) {
    if (MODIFIABLE_NODES) {
        $(div + ' .infobox #label').show();
        $(div + ' .infobox #label-plain').hide();
    }
    else {
        $(div + ' .infobox #label').hide();
        $(div + ' .infobox #label-plain').show();
    }
}

function update_infobox(obj) {
    if (!MENU) {
        return;
    }
    var pos, index, node, edge;
    if (obj && obj instanceof Vertex) {
        node = obj, pos = node.get_pos(), index = nodes.indexOf(node);
        update_infobox_label(div);
        $(div + ' .infobox #title').html('Vertex Info');
        $(div + ' .infobox #index').html(index);
        $(div + ' .infobox #pos').show();
        $(div + ' .infobox #posx').html(pos.x.toFixed(1));
        $(div + ' .infobox #posy').html(pos.y.toFixed(1));
        $(div + ' .infobox #vert').hide();
        $(div + ' .infobox #label').val(node.label);
        $(div + ' .infobox #label-plain').html(node.label);
        $(div + ' .infobox #none_selected').hide();
        $(div + ' .infobox #info').show();
    } else if (obj && obj instanceof Edge) {
        edge = obj;
        var enodes = edge.get_nodes();
        index = edge_list.indexOf(edge);
        $(div + ' .infobox #label').show();
        $(div + ' .infobox #label-plain').hide();
        $(div + ' .infobox #title').html('Edge Info');
        $(div + ' .infobox #index').html(index);
        $(div + ' .infobox #pos').hide();
        $(div + ' .infobox #vert').show();
        //$(div + ' .infobox #v1').html(nodes.indexOf(enodes.node1));
        //$(div + ' .infobox #v2').html(nodes.indexOf(enodes.node2));
        $(div + ' .infobox #v1').html(enodes.node1.label);
        $(div + ' .infobox #v2').html(enodes.node2.label);
        $(div + ' .infobox #label').val(edge.label||'');
        $(div + ' .infobox #label-plain').html(edge.label||'');
        $(div + ' .infobox #none_selected').hide();
        $(div + ' .infobox #info').show();
    } else {
        $(div + ' .infobox #title').html('Info');
        $(div + ' .infobox #none_selected').show();
        $(div + ' .infobox #info').hide();
    }
}
