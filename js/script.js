const svg = d3.select("#map");
const width = +svg.attr("width");
const height = +svg.attr("height");

const tooltip = d3.select("#tooltip");

// Projection
const projection = d3.geoNaturalEarth1()
  .scale(180)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Color scale (OWID style)
const colorScale = d3.scaleSequential(d3.interpolateYlGnBu);

// Current mode
let currentFlow = "ODA";

// Legend group
const legendGroup = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width - 200}, ${height /2.5 - 225})`);

// Load data
Promise.all([
  d3.json("data/world.geojson"),
  d3.csv("data/aiddata.csv")
]).then(([world, data]) => {

  // ---------- AGGREGATE DATA ----------
  function aggregate(flowType) {
    return d3.rollups(
      data.filter(d => d["Flow Type"] === flowType),
      v => v.length,
      d => d["Recipient ISO-3"]?.trim().toUpperCase()
    );
  }

  let counts = new Map(aggregate(currentFlow));
  let maxValue = d3.max(counts.values()) || 1;
  colorScale.domain([0, maxValue]);

  // ---------- DRAW MAP ----------
  const countries = svg.append("g")
    .selectAll("path")
    .data(world.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke", "#aaa")
    .attr("stroke-width", 0.4)
    .attr("fill", d => {
      const iso = d.properties["ISO3166-1-Alpha-3"]?.trim().toUpperCase();
      const value = counts.get(iso) || 0;
      return value > 0 ? colorScale(value) : "#eeeeee";
    })
    
    .on("mouseover", (event, d) => {
      const iso = d.properties["ISO3166-1-Alpha-3"]?.trim().toUpperCase();
      const value = counts.get(iso) || 0;

      tooltip
        .style("display", "block")
        .html(`
          <strong>${d.properties.name}</strong><br>
          ${currentFlow} projects: ${value}
        `);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.offsetX + 10 + "px")
        .style("top", event.offsetY + 10 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // ---------- LEGEND ----------
  function updateLegend(maxValue) {
    legendGroup.selectAll("*").remove();
    legendGroup.attr("transform", "translate(10, 400)");
    svg.select("defs")?.remove();

    const legendWidth = 200;
    const legendHeight = 20;

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient");

    gradient.selectAll("stop")
      .data(d3.ticks(0, 1, 10))
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => colorScale(d * maxValue));

    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickSize(6);

    legendGroup.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .select(".domain")
      .remove();

    legendGroup.append("text")
      .attr("x", 10)
      .attr("y", -5)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(`${currentFlow} project count`);
  }

  updateLegend(maxValue);

  // ---------- UPDATE FUNCTION ----------
  function update(flowType) {
    currentFlow = flowType;
    counts = new Map(aggregate(flowType));

    const maxValue = d3.max(counts.values()) || 1;
    colorScale.domain([0, maxValue]);
    updateLegend(maxValue);

    countries
      .transition()
      .duration(600)
      .attr("fill", d => {
        const iso = d.properties["ISO3166-1-Alpha-3"]?.trim().toUpperCase();
        const value = counts.get(iso) || 0;
        return value > 0 ? colorScale(value) : "#eeeeee";
      });
  }

  // ---------- BUTTON HANDLERS ----------
  d3.select("#odaBtn").on("click", () => {
    d3.selectAll("button").classed("active", false);
    d3.select("#odaBtn").classed("active", true);
    update("ODA");
  });

  d3.select("#oofBtn").on("click", () => {
    d3.selectAll("button").classed("active", false);
    d3.select("#oofBtn").classed("active", true);
    update("OOF");
  });

});
