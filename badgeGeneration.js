import { cleanDataset } from "./js/cleanData.js"
import { drawChart } from "./js/drawChart.js"

// Global variables
const spreadsheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJlYdfj_WRjc4vIkaPsATqb0J48N17MU2g2zT4G28tyGl2p366fx29SpZJyO7JlCUax_F5FWzg6zVF/pub?output=csv"

const localURL = "survey_data.csv"

// const w = window.innerWidth
// const h = window.innerHeight
const w = 700
const h = 700

const zoom = d3.zoom().on("zoom", zoomed)

const svg = d3
  .select("#badge-visualization")
  .attr("width", w)
  .attr("height", h)
  .call(zoom)
  .select("g")

function zoomed(e) {
  const { x, y, k } = e.transform
  svg.attr("transform", "translate(" + x + "," + y + ")" + " scale(" + k + ")")
}

function zoomToNode(root, scales) {
  const originalMail = d3.select("#mail-input").nodes()[0].value
  const selctedMail = originalMail.replace("@", "-").replace(".", "-").toLowerCase()

  console.log(selctedMail)
  const node = d3.select(`#mail-${selctedMail}`)
  console.log(node)
  const x = +node.attr("cx")
  const y = +node.attr("cy")
  const k = 3

  d3.select("svg")
    .transition()
    .call(zoom.transform, d3.zoomIdentity.scale(k).translate(-x + w / k / 2, -y + w / k / 2))

  // Find the node with the matching mail in the hierarchy
  const selectedNode = root.descendants().find((d) => d.data.mail && d.data.mail === selctedMail)

  if (selectedNode) {
    drawLollipop([selectedNode], scales)
  } else {
    console.warn("Node not found for:", selctedMail)
  }
}

d3.csv(localURL).then((rawData) => {
  const cleanData = cleanDataset(rawData)
  console.log("clean data: ", cleanData)

  const root = createHierarchy(cleanData)

  const scales = computeScales(cleanData)
  const buttonInput = d3.select("#input-button").on("click", () => zoomToNode(root, scales))

  drawChart(root, scales, svg, w, h)
})

function createHierarchy(data) {
  const treeDataRollup = d3.rollup(
    data,
    (D) => D,
    (d) => d.topic,
    (d) => d.role,
    (d) => d.experience
  )

  const root = d3.hierarchy(treeDataRollup)

  console.log("root", root)
  console.log("descendants", root.descendants())
  console.log("links", root.links())

  return root
}

function computeScales(data) {
  // Define a color palette
  const colorPalette = [
    "#FF6B6B", // Coral Red
    "#4ECDC4", // Turquoise
    "#45B7D1", // Sky Blue
    "#96CEB4", // Mint Green
    "#FFEAA7", // Warm Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Seafoam
    "#F7DC6F", // Banana Yellow
    "#BB8FCE", // Light Purple
    "#85C1E9", // Light Blue
    "#F8C471", // Peach
    "#82E0AA", // Light Green
  ]

  const skillExtent = [1, 5]

  const uniqueSkills = data[0].skills.map((d) => d.name)
  console.log("unique skills", uniqueSkills)

  const sizeScale = d3.scaleLinear().domain(skillExtent).range([1, 5])
  const distanceScale = d3.scaleLinear().domain(skillExtent).range([5, 15])
  const skillColor = d3.scaleOrdinal(uniqueSkills, colorPalette)

  const scales = {
    size: sizeScale,
    distance: distanceScale,
    color: skillColor,
  }

  return scales
}

function drawLollipop(nodes, scales) {
  // console.log(nodes)
  // const nodes = root.descendants().filter((d) => d.depth === root.height)

  svg
    .select("g.lollipops")
    .selectAll("g.lollipop-group")
    .data(nodes, (d) => d.data.mail) // Key function for proper data binding
    .join(
      // ENTER: New elements
      (enter) => {
        const enterGroups = enter
          .append("g")
          .classed("lollipop-group", true)
          .attr("transform", (d) => `translate(${w / 2 + d.computedX}, ${h / 2 + d.computedY})`)
          .style("opacity", 0) // Start invisible
          .style("transform-origin", "center")

        // Create the lollipop structure for new elements
        enterGroups.each(function (d) {
          const group = d3.select(this)

          d.data.skills.forEach((skill, i) => {
            // Create skill group for better organization
            const skillGroup = group
              .append("g")
              .classed("skill-group", true)
              .attr("data-skill", skill.name)

            // Line (start from center, will animate outward)
            skillGroup
              .append("line")
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", 0) // Start at center
              .attr("y2", 0) // Start at center
              .attr("stroke", "black")
              .attr("stroke-width", 0.1)
              .attr("opacity", 0)

            // Proficiency dot (start small)
            skillGroup
              .append("circle")
              .classed("proficiency-dot", true)
              .attr("cx", 0) // Start at center
              .attr("cy", 0) // Start at center
              .attr("r", 0) // Start with no radius
              .attr("fill", scales.color(skill.name))
              .attr("opacity", 0)

            // Interest square (start small)
            skillGroup
              .append("rect")
              .classed("interest-square", true)
              .attr("width", 0) // Start with no size
              .attr("height", 0)
              .attr("rx", 1)
              .attr("ry", 1)
              .attr("x", 0) // Start at center
              .attr("y", 0)
              .attr("fill", scales.color(skill.name))
              .attr("opacity", 0)
              .attr("stroke", "#333")
              .attr("stroke-width", 1)
          })
        })

        // Animate entrance
        return enterGroups
          .transition()
          .duration(800)
          .delay((d, i) => i * 100) // Stagger the entrances
          .ease(d3.easeBackOut)
          .style("opacity", 1)
          .call((transition) => {
            // Animate each skill element
            transition.selectAll(".skill-group").each(function (d, skillIndex) {
              const skillGroup = d3.select(this)
              const skill = d.data.skills[skillIndex]
              const angle = (skillIndex / d.data.skills.length) * 2 * Math.PI - Math.PI / 2
              const profRadius = scales.size(skill.proficency)
              const intRadius = scales.size(skill.interest)
              const profDist = scales.distance(skill.proficency)
              const intDist = scales.distance(skill.interest)
              const maxDist = Math.max(profDist, intDist)
              const x2 = Math.cos(angle) * maxDist
              const y2 = Math.sin(angle) * maxDist

              // Animate line growth
              skillGroup
                .select("line")
                .transition()
                .duration(600)
                .delay(skillIndex * 50)
                .ease(d3.easeElasticOut)
                .attr("x2", x2)
                .attr("y2", y2)
                .attr("opacity", 1)
                .attr("stroke-width", 1)

              // Animate proficiency dot
              skillGroup
                .select(".proficiency-dot")
                .transition()
                .duration(400)
                .delay(300 + skillIndex * 50)
                .ease(d3.easeBounceOut)
                .attr("cx", x2)
                .attr("cy", y2)
                .attr("r", profRadius)
                .attr("opacity", 1)

              // Animate interest square
              skillGroup
                .select(".interest-square")
                .transition()
                .duration(400)
                .delay(350 + skillIndex * 50)
                .ease(d3.easeBounceOut)
                .attr("width", intRadius)
                .attr("height", intRadius)
                .attr("x", Math.cos(angle) * intDist - intRadius / 2)
                .attr("y", Math.sin(angle) * intDist - intRadius / 2)
                .attr("opacity", 1)
            })
          })
      },

      // UPDATE: Existing elements
      (update) => {
        // Animate position changes
        const updatedGroups = update
          .transition()
          .duration(600)
          .ease(d3.easeQuadInOut)
          .attr("transform", (d) => `translate(${w / 2 + d.computedX}, ${h / 2 + d.computedY})`)

        // Update each skill element
        updatedGroups.each(function (d) {
          const group = d3.select(this)

          // Remove all existing skill groups and recreate (or you could be more surgical)
          group.selectAll(".skill-group").remove()

          d.data.skills.forEach((skill, i) => {
            const angle = (i / d.data.skills.length) * 2 * Math.PI - Math.PI / 2
            const profRadius = scales.size(skill.proficency)
            const intRadius = scales.size(skill.interest)
            const profDist = scales.distance(skill.proficency)
            const intDist = scales.distance(skill.interest)
            const maxDist = Math.max(profDist, intDist)
            const x2 = Math.cos(angle) * maxDist
            const y2 = Math.sin(angle) * maxDist

            const skillGroup = group
              .append("g")
              .classed("skill-group", true)
              .attr("data-skill", skill.name)

            // Line
            skillGroup
              .append("line")
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", x2)
              .attr("y2", y2)
              .attr("stroke", "black")
              .attr("stroke-width", 1)
              .attr("opacity", 0)
              .transition()
              .duration(400)
              .delay(i * 30)
              .attr("opacity", 1)

            // Proficiency dot
            skillGroup
              .append("circle")
              .classed("proficiency-dot", true)
              .attr("cx", x2)
              .attr("cy", y2)
              .attr("r", 0)
              .attr("fill", scales.color(skill.name))
              .attr("opacity", 0)
              .transition()
              .duration(300)
              .delay(150 + i * 30)
              .ease(d3.easeBackOut)
              .attr("r", profRadius)
              .attr("opacity", 1)

            // Interest square
            skillGroup
              .append("rect")
              .classed("interest-square", true)
              .attr("width", 0)
              .attr("height", 0)
              .attr("rx", 1)
              .attr("ry", 1)
              .attr("x", Math.cos(angle) * intDist)
              .attr("y", Math.sin(angle) * intDist)
              .attr("fill", scales.color(skill.name))
              .attr("opacity", 0)
              .attr("stroke", "#333")
              .attr("stroke-width", 1)
              .transition()
              .duration(300)
              .delay(200 + i * 30)
              .ease(d3.easeBackOut)
              .attr("width", intRadius)
              .attr("height", intRadius)
              .attr("x", Math.cos(angle) * intDist - intRadius / 2)
              .attr("y", Math.sin(angle) * intDist - intRadius / 2)
              .attr("opacity", 1)
          })
        })

        return updatedGroups
      },

      // EXIT: Elements being removed
      (exit) => {
        return exit
          .transition()
          .duration(500)
          .ease(d3.easeBackIn)
          .style("opacity", 0)
          .style("transform", "scale(0)")
          .call((transition) => {
            // Animate individual skill elements shrinking
            transition.selectAll(".skill-group").each(function (d, i) {
              const skillGroup = d3.select(this)

              // Shrink lines
              skillGroup
                .select("line")
                .transition()
                .duration(300)
                .delay(i * 20)
                .attr("x2", 0)
                .attr("y2", 0)
                .attr("opacity", 0)

              // Shrink dots
              skillGroup
                .selectAll("circle, rect")
                .transition()
                .duration(200)
                .delay(100 + i * 20)
                .attr("r", 0)
                .attr("width", 0)
                .attr("height", 0)
                .attr("opacity", 0)
            })
          })
          .remove() // Remove from DOM after animation
      }
    )
}
