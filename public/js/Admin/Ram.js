let donut_dims = {
  "width": 600,
  "height": 400,
  "margin": 20,
}
let data = {
  "Used Memory": 10,
  "Free Memory": 90,
}
let ramChart = document.getElementById("ram");

setInterval(() => {
  if (data["Free Memory"] != ramChart.dataset.free || data["Used Memory"] != ramChart.dataset.used) {
    data["Free Memory"] = ramChart.dataset.free;
    data["Used Memory"] = ramChart.dataset.used;
    ram_update();
  }
}, 1000)

const donut_svg = d3.select("#ram").append("svg").attr("width", donut_dims.width).attr("height", donut_dims.height).append("g").attr("transform", `translate(${donut_dims.width / 2},${donut_dims.height / 2})`);
let taken_colour = "#1633ff";
let free_colour = "#c4c4c4"

function ram_update() {
  while (document.getElementsByClassName("ram-labels").length > 0) {
    document.getElementsByClassName("ram-labels")[0].remove()
  }
  while (document.getElementsByClassName("ram-line").length > 0) {
    document.getElementsByClassName("ram-line")[0].remove()
  }
  let donut = d3.pie().value(function (d) { return d[1] }).sort(function (a, b) { return a < b }).startAngle(3 * Math.PI).endAngle(6 * Math.PI);
  var data_ready = donut(Object.entries(data))
  const arc = d3.arc()
    .innerRadius(100)
    .outerRadius(140)
  const outerArc = d3.arc()
    .innerRadius(140 * 0.9)
    .outerRadius(140 * 0.9)
  var u = donut_svg.selectAll("path")
    .data(data_ready)
  u
    .enter()
    .append('path')
    .merge(u)
    .transition()
    .duration(100)
    .attr('d', d3.arc()
      .innerRadius(120)
      .outerRadius(140)
    )
    .attr('fill', function (d) { return (d.data[0] == "Free Memory" ? free_colour : taken_colour) })
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 1)

  donut_svg
    .selectAll('ram-line')
    .data(data_ready)
    .join('polyline')
    .attr("stroke", "black")
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr("class", "ram-line")
    .attr('points', function (d) {
      const posA = arc.centroid(d) 
      const posB = outerArc.centroid(d) 
      const posC = outerArc.centroid(d); 
      const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 
      posC[0] = 300 * 0.95 * (midangle < Math.PI ? -1 : 1); 
      return [posA, posB, posC]
    })

  
  donut_svg

    .selectAll('ram-labels')
    .data(data_ready)

    .join('text')
    .attr("class", "ram-labels")
    .text(d => `${d.data[0]} \(${d.data[1]}%\)`)
    .attr('transform', function (d) {
      const pos = outerArc.centroid(d);
      const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      pos[0] = 300 * 0.99 * (midangle < Math.PI ? -1 : 1);
      pos[1] -= 5;
      return `translate(${pos})`;
    })
    .style('text-anchor', function (d) {
      const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      return (midangle < Math.PI ? 'start' : 'end')
    })


}
ram_update();
ramChart.dataset.free = data["Free Memory"]
ramChart.dataset.used = data["Used Memory"]