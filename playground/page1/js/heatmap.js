var Heatmap = (function(window, d3) {
    var svg,
        rect,
        g,
        data, 
        color,
        projection,
        path,
        effectLayer,
        mapLayer,
        features, 
        dummyText,
        bigText,
        centered,
        districts,
        margin = {}, 
        width,
        height;

    // sets width and height, necessary for mapLayer
    updateDimensions();

    // Load halts data
    d3.json('data/district.json', function(error, districtData) {
        districts = districtData.districts;
    });

    // Load map data
    d3.json('data/munich.geojson', init);

    function init(error, heatData){
        features = heatData.features;    
        
        // Define color scale
        // Update color scale domain based on data
        color = d3.scaleLinear()
            .domain([0, d3.max(features, nameLength)])
            .clamp(true)
            .range(['#fff', '#409A99']);

        // Define color scale
        // Update color scale domain based on data
        // var color = d3.scaleSequential(d3.interpolateWarm)
        // .domain([6000, 0]);
        // color.domain([d3.max(features, nameLength), 0]);
        // color.domain([0, d3.max(features, nameLength)]);
    
        // Set svg width & height
        svg = d3.select('svg');

        // Add background
        rect = svg.append('rect')
            .attr('class', 'background')
            .on('click', clicked);

        g = svg.append('g');

        effectLayer = g.append('g')
            .classed('effect-layer', true);

        mapLayer = g.append('g')
            .classed('map-layer', true);

        dummyText = g.append('text')
            .classed('dummy-text', true)
            .attr('x', 10)
            .attr('y', 30)
            .style('opacity', 0);

        bigText = g.append('text')
            .classed('big-text', true)
            .attr('x', 20)
            .attr('y', 45);

        projection = d3.geoMercator()
                .scale( width * 150)
                // Center the Map in Munich
                .center([11.542, 48.155])
                .translate([width / 2, height / 2]);

        path = d3.geoPath()
            .projection(projection);

        // Draw each province as a path
        mapLayer.selectAll('path')
            .data(features)
            .enter().append('path')
            .attr('d', path)
            .attr('vector-effect', 'non-scaling-stroke')
            .style('fill', fillFn)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', clicked);        

        render();  
    }

    function render() {
        //get dimensions based on window size
        updateDimensions();

        //update svg elements to new dimensions
        svg
          .attr('width', width)
          .attr('height', height);

        rect
            .attr('width', width)
            .attr('height', height);

        projection
            .scale( width * 150 )
            .translate([width / 2, height / 2]);

        d3.selectAll("path").attr('d', path);
    }

    function updateDimensions() {
        width = parseInt(d3.select('#heatmap').style('width'));

        width = width;
        height = 0.78 * width; //aspect ratio is 0.78
    }

    

    // Get province name
    function nameFn(d) {
        return d && d.properties ? d.properties.name : null;
    }

    // Get province name length
    function getDistrict(d) {
        var n = nameFn(d);
        
        var index = districts.findIndex(function (district) {
          return district.name === n;
        });

        return districts[index];
    }

    // Todo rename getTotalCount
    function nameLength(d) {
      return getDistrict(d).monthlyAverage;
    }

    // Get province color
    function fillFn(d) {
        return color(nameLength(d));
    }

    // When clicked, zoom in
    function clicked(d) {
        var x, y, k;

        // Compute centroid of the selected path
        if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 4;
            centered = d;
        } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;
        }

        // Highlight the clicked province
        mapLayer.selectAll('path')
            .style('fill', function(d) {
                return centered && d === centered ? '#D5708B' : fillFn(d);
            });

        Hexmap.loadDistrict(d.properties.cartodb_id);

        // // Zoom
        // g.transition()
        //     .duration(750)
        //     .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
    }

    function mouseover(d) {
        // Highlight hovered province
        d3.select(this).style('fill', 'orange');

        // Draw effects
        textArt(getDistrict(d));
    }

    function mouseout(d) {
        // Reset province color
        mapLayer.selectAll('path')
            .style('fill', function(d) {
                return centered && d === centered ? '#D5708B' : fillFn(d);
            });

        // Remove effect text
        effectLayer.selectAll('text').transition()
            .style('opacity', 0)
            .remove();

        // Clear province name
        bigText.text('');
    }

    // Gimmick
    // Just me playing around.
    // You won't need this for a regular map.

    function textArt(district) {
        bigText
        // .style('font-family', fontFamily)
            .text(district.name + ': sum ' + district.totalCount + ' monthly average ' + district.monthlyAverage);

    }

    return {
        render : render
    };
})(window, d3);

window.addEventListener('resize', Heatmap.render);