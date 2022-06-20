let cpu_margin = { top: 30, right: 30, bottom: 70, left: 60 }
let bar_dims = {
  width: 700 - cpu_margin.left - cpu_margin.right,
  height: 500 - cpu_margin.top - cpu_margin.bottom
}
let cpuData = [

]
setInterval(() => {
  cpuData = []
  let cpuArr = document.getElementById("cpu").dataset.cpu.split(",")
  console.log(cpuArr)
  for (let i = 0; i < cpuArr.length; i++) {
    cpuData.push({ "cpu": "Core " + (i + 1), "usage": cpuArr[i] })
  }
  console.log(cpuData)
  cpu_update();
}, 4000)
const cpu_svg = d3.select("#cpu")
  .append("svg")
  .attr("width", bar_dims.width)
  .attr("height", bar_dims.height)
  .append("g")
  .attr("transform", `translate(${cpu_margin.left},${cpu_margin.top})`)
cpu_svg.append("text")
  .attr("class", "y label")
  .attr("text-anchor", "end")
  .attr("y", -45)
  .attr("x", -150)
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .text("Core Usage (%)");

function cpu_update() {
  let x = d3.scaleBand()
    .range([0, bar_dims.width - 60])
    .domain(cpuData.map(function (d) { return d.cpu }))
    .padding(0.2)

  cpu_svg.append("g")
    .attr("transform", `translate(0, ${bar_dims.height - 60})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));


  let y = d3.scaleLinear()
    .domain([0, 100])
    .range([bar_dims.height - 60, 0]);
  cpu_svg.append("g")
    .call(d3.axisLeft(y))




  cpu_svg.selectAll("bar")
    .data(cpuData)
    .join("rect")
    .attr("x", function (d) { return x(d.cpu) })
    .attr("y", function (d) { return y(d.usage) })
    .attr("width", x.bandwidth())
    .attr("height", d => bar_dims.height - 60 - y(d.usage))
    .attr("fill", "#69b3a2")
}
cpu_update()