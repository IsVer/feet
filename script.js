// Two options:
// 1. Randomly generating an artist, and then make a playlist with that.
// 2. Randomly selecting an artist from your list, and then make a map with that. Playlist option.
//////////////////////////////////////////////////////////////////////////////////////////////////
//
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
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(210))
    .force("charge", d3.forceManyBody().strength(-400).distanceMin(150).distanceMax(300)) //how far removed from each other, the more in minus the farther
    // .force("charge", d3.forceManyBody().strength(-540).distanceMax(800).distanceMin(400)) //how far removed from each other, the more in minus the farther
    .force("center", d3.forceCenter(width/2, height / 1.4))
    .force("collide", d3.forceCollide().strength(0.99).iterations(4));
    // .force("collide", d3.forceCollide().strength(0.99).radius(function(d) { return d.r + 10; }).iterations(4));
    // .force("positioning", d3.forceY(function(d){return d.id*3}));
    // .force("positioning", d3.forceX(1).strength(function(d){return d.id}))
    // .force("positioning", d3.forceY(1).strength(function(d){return d.id}));

d3.json("data_cleaned.json", function(error, graph) {
    if (error) throw error;


    // build graph
    const links = addNodeLinks(svg, graph);
    const nodes = addNodes(svg, graph);
    const images = addNodeImages(svg, nodes, graph);
    const labels = addNodeTitles(svg, graph);


    // add interactions and animations
    attachMouseEventsToCircles(images);
    makeGraphWobbly(graph, links, labels, nodes, images)
});


function addNodeLinks(svg, graph) {
    graph.links.forEach(function(d){
        d.source = d.source_id;
        d.target = d.target_id;
    });

    // add links to circle nodes
    let links = svg.append("g")
        .style("stroke", "#aaa")
        .attr("class", "links")
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
        .attr("r", 6);
        // .call(d3.drag()
        //     .on("start", dragstarted)
        //     .on("drag", dragged)
        //     .on("end", dragended));

    return nodes;
}

function addNodeImages(svg, nodes, graph) {
    // add an image to each node
    let images = svg.append("g")
        .attr("class", "imgs")
        .selectAll("image")
        .data(graph.nodes)
        .enter().append("image")
        .attr("id", function (d) {
            const nameIm = d.name.toLocaleLowerCase().split(' ').join('-') + '-img';
            return nameIm;
        })
        .attr("xlink:href",  function(d) { return d.url;})
        // .attr("xlink:href", "https://static.pexels.com/photos/126407/pexels-photo-126407.jpeg")
        .attr("height", 50)
        .attr("width", 50)
        // add moving effect
        .on('click', function() {
            let sel = d3.select(this);
            sel.moveToFront();
        })
        .on('click', function() {
            d3.select(nameIm).moveToBack();
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


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

function attachMouseEventsToCircles(images) {
    // called when mouse enters node
    function handleMouseOver(node) {
        const name = node.name.toLocaleLowerCase().split(' ').join('-') + '-title';
        const nodeId = '#' + name;
        d3.selectAll(nodeId).style("opacity", 1);
        //
        const nameIm = node.name.toLocaleLowerCase().split(' ').join('-') + '-img';
        const imgId = "#" + nameIm;
        d3.selectAll(imgId).raise();
    }

    // called when stop hover over a node
    function handleMouseOut(node) {
        const name = node.name.toLocaleLowerCase().split(' ').join('-') + '-title';
        const nodeId = '#' + name;
        d3.selectAll(nodeId).style("opacity", 0);
        //
        // const nameIm = node.name.toLocaleLowerCase().split(' ').join('-') + '-img';
        // const imgId = "#" + nameIm;
        // d3.selectAll(imgId).lower();
    }

    // add mouse event listeners to the images nodes
    images
        .on("mouseout", handleMouseOut)
        .on("mouseover", handleMouseOver)
}

function makeGraphWobbly(graph, links, labels, nodes, images) {
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
            .attr("x", function(d) { return d.x -40; })
            .attr("y", function (d) { return d.y-17; })
            .style("font-size", "14px").style("fill", "#feffe5")
            .style("z-index", -3)
            .style("font-family", "monospace, serif");

        nodes
            .attr("r", 20)
            .style("fill", "none")
            // .style("stroke", "#969696")
            .style("stroke-width", "1px")
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function(d) { return d.y; });


        images
            .attr("height", 70)
            .attr("width", 70)
            .attr("x", function(d) { return d.x-30; })
            .attr("y", function (d) { return d.y-30; });
    }
}




function dragstarted(d) {
    if (!d3.event.active) simulation.alpha(0.99).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alpha(0.99).restart();
    d.fx = null;
    d.fy = null;
}
