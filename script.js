// Two options:
// 1. Randomly generating an artist, and then make a playlist with that.
// 2. Randomly selecting an artist from your list, and then make a map with that. Playlist option.
//////////////////////////////////////////////////////////////////////////////////////////////////

const app = {}; //object to store properties and methods

app.apiUrl = 'https://api.spotify.com/v1/me';
let accessToken = 'cfa13df4cefe4c928e2d8627e1469eab';/// this is not correct anymore
let userToken = 'AQC5jFkJQ2hbdIu_icw1k6GhokPt2ux0C6m9t_RGten0FAq_NGJpaVU5FG-SASUNQG318g0WxKYH9Z19AEZOySVetj0pb3PFde99h7peCWPFnlqEYpx7gL1KifzLTqRrXknMEShKAgfqRHGibnbZ7rhPHxn_dbMngj90NcpJazPezF7tzBu2Qt_YDXpRrJmoIuhLYt7eQCbZxS3a3jh7uQ4thzIycaVGOhyfVvf8VA&state=jLrKyrJ6JjhT7rdt';


// get artist name from user's submission
app.events = function(){
  $('form').on('submit', function(e) { //DOM look up with jQuery
      e.preventDefault();
      let artists = $('input[type=search]').val();
      artists = artists.split(',');

      app.searchPressed(artists[0]);
      // let search = artists.map(artistName => app.searchArtist(artistName));
  })
};

app.searchPressed = function (artistName) {

    if (userToken) {
        //search
        app.searchArtist(artistName, function(results) {
            console.log(results);
        });
    }else {
        app.authorize(function (token) {
            //search
            app.searchArtist(artistName, function(results) {
                console.log(results);
            });
        });
    }
};


// get artist id from Spotify API
app.searchArtist = function (artistName, onSuccess) {

    $.ajax({
        url: `${app.apiUrl}/search`,
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        method: 'GET',
        dataType: 'json',
        data: {
            q: artistName,
            type: 'artist'
        },
        success: function(response) {
            onSuccess(response);
        }
    });

};



//
//
// app.authorize = function (onSuccess) {
//
//     $.ajax({
//         url: 'https://api.spotify.com/v1/me',
//         headers: {
//             'Authorization': 'Bearer ' + accessToken
//         },
//         success: function(response) {
//             userToken = response.userToken;
//             onSuccess(userToken);
//         }
//     });
//
// };


// for this artist, get album, tracks and related artists
app.init = function() {
    app.events();
};

$(app.init); //jQuery to get it started


//////////////////////////////////////////////////////////////////////////////////////////////////
/* global d3 */

let svg = d3.select("#network"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(180))
    .force("charge", d3.forceManyBody().strength(-400)) //how far removed from each other, the more in minus the farther
    .force("center", d3.forceCenter(width/2, height / 2));


d3.json("data_cleaned.json", function(error, graph) {
    if (error) throw error;


    // build graph
    const links = addNodeLinks(svg, graph);
    const nodes = addNodes(svg, graph);
    // const images = addNodeImages(svg, nodes, graph);
    const labels = addNodeTitles(svg, graph);


    // add interactions and animations
    attachMouseEventsToCircles(nodes);
    makeGraphWobbly(graph, links, labels, nodes)
});


function addNodeLinks(svg, graph) {
    graph.links.forEach(function(d){
        d.source = d.source_id;
        d.target = d.target_id;
    });

    // add links to circle nodes
    let links = svg.append("g")
        .style("stroke", "#aaa")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line");
    return links
}

function addNodes(svg, graph) {
    // add circles nodes to graph
    let nodes = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("id", function (d) {
            const name = d.name.toLocaleLowerCase().split(' ').join('-');
            return name;
        })
        .attr("r", 6)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    return nodes;
}

function addNodeImages(svg, nodes, graph) {
    // add an image to each node
    // TODO: make this work
    let images = nodes.append("images")
        .attr("xlink:href", function(d){return d.url;});

    return images;
}

function addNodeTitles(svg, graph) {
    // add title nodes to graph
    let labels = svg.append("g")
        .selectAll("text")
        .data(graph.nodes)
        .enter().append("text")
        .attr("id", function (d) {
            const name = d.name.toLocaleLowerCase().split(' ').join('-') + '-title';
            return name;
        })
        .text(function(d) { return d.name;})
        .attr("opacity", 0);

    return labels;
}

function attachMouseEventsToCircles(circles) {

    // called when mouse enters node
    function handleMouseOver(node) {
        const name = node.name.toLocaleLowerCase().split(' ').join('-') + '-title';
        const nodeId = '#' + name;
        d3.selectAll(nodeId).style("opacity", 1);
    }

    // called when stop hover over a node
    function handleMouseOut(node) {
        const name = node.name.toLocaleLowerCase().split(' ').join('-') + '-title';
        const nodeId = '#' + name;
        d3.selectAll(nodeId).style("opacity", 0);
    }

    // add mouse event listeners to the circle nodes
    circles
        .on("mouseout", handleMouseOut)
        .on("mouseover", handleMouseOver);
}

function makeGraphWobbly(graph, links, labels, nodes) {
    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
        links
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        labels
            .attr("x", function(d) { return d.x+4; })
            .attr("y", function (d) { return d.y; })
            .style("font-size", "14px").style("fill", "#181c59")
            .style("font-family", "monospace, serif");

        nodes
            .attr("r", 20)
            .style("fill", "#d9d9d9")
            // .style("stroke", "#969696")
            .style("stroke-width", "1px")
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function(d) { return d.y; });


        // images
        //     .attr("x", function(d) { return d.x; })
        //     .attr("y", function (d) { return d.y; });
    }
}


// // movement
// function dragstarted(d) {
//     if (!d3.event.active) simulation.alphaTarget(1).restart();
//     simulation.fix(d);
// }
//
// function dragged(d) {
//     simulation.fix(d, d3.event.x, d3.event.y);
// }
//
// function dragended(d) {
//     if (!d3.event.active) simulation.alphaTarget(1).restart();
//     simulation.fix(d);
// }


function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.9).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0.9);
    d.fx = null;
    d.fy = null;
}




//
//
// let canvas = d3.select('#network'),
//     width = +canvas.attr("width"),
//     height = +canvas.attr("height");
//
// let r = 3;
//
// let context = canvas.node().getContext('2d');
// let simulation = d3.forceSimulation()
//     .force('x', d3.forceX(width / 3))
//     .force('y', d3.forceY(height/ 3))
//     .force('charge', d3.forceManyBody(r+1)
//         .strength(-400))
//     .force('link', d3.forceLink()
//         .id(function(d){return d.name;}))
//     .on("tick", update);
//
// simulation.nodes(graph.nodes);
// simulation.force('link');
//
// function update() {
//     context.clearRect(0, 0, width, height);
//
//     context.beginPath();
//     graph.links.forEach(drawLink); //for each node draw node
//     context.fill();
//
//     context.beginPath();
//     graph.nodes.forEach(drawNode); //for each node draw node
//     context.stroke();
// }
//
//
// function drawNode(d) { //each drawnode picks up one datum
//     context.moveTo(d.x, d.y);
//     context.arc(d.x, d.y, r, 0, 2*Math.PI); //position of the dot, with 0 degrees until 2*PI
// }
//
// function drawLink(l) { //each drawnode picks up one datum
//     context.moveTo(l.source.x, l.source.y);
//     context.lineTo(l.target.x, l.target.y, r, 0, 2*Math.PI); //position of the dot, with 0 degrees until 2*PI
// }
//
//
//
// update();
//
// // let network = d3.select('svg').append('svg')
// //     .attr('width', width)
// //     .attr('height', height)
// //     .style('color', 'blue');
// //
// //
// //
// //
// // let width = window.innerWidth;
// // let height = window.innerHeight;
// //
// // let nodes  = [
// //     {x: width/3, y: height/2},
// //     {x: 2*width/3, y: height/2}
// // ];
// //
// //
// // let links = [
// //     {source: 0, target: 1}
// // ];
// //
// //
// // let simulation = d3.forceSimulation()
// //     .force("charge", d3.forceManyBody().strength(-200))
// //     .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(40))
// //     .force("x", d3.forceX(width / 2))
// //     .force("y", d3.forceY(height / 2))
// //     .on("tick", ticked);