import { polarToCartesian } from "./utils/utils.js"

export function drawChart(root, scales, svg, w, h, zoomLevel) {
  const endNodes = root.descendants().filter((d) => d.depth === root.height)

  const animationDuration = 800
  const delay = 500
  const leafDelay = 200

  const offset = 0

  const radius = 250
  const treeLayout = d3.cluster().size([2 * Math.PI, radius])

  const circlesRadii = d3.scaleLinear([0, root.height], [10, treeLayout.size()[1]])

  treeLayout(root)

  // Add computed x,y coordinates to each node
  root.descendants().forEach((d) => {
    const coords = polarToCartesian(d.x, d.y)
    d.computedX = coords.x
    d.computedY = coords.y
  })

  drawCircles()

  drawLeaves()

  drawNodes(root.descendants())

  drawLinks()

  drawPetals()

  //   drawLollipop()

  updateChart(endNodes)

  function drawCircles() {
    //TODO Compute it
    const depths = [0, 1, 2, 3, 4]
    svg
      .select("g.circles")
      .selectAll(".circle")
      .data(depths)
      .join("circle")
      .attr("cx", w / 2)
      .attr("cy", h / 2)
      .attr("r", (d) => (d === 0 ? radius : circlesRadii(d)))
      .attr("fill", (d) => (d === 0 ? "url(#grad1)" : "url(#grad2 )"))
      .attr("opacity", (d) => (d === 0 ? 1 : 0))
      .attr("stroke-width", (d) => (d === 0 ? 0 : 5))
      .classed("circle", true)
  }

  function drawLeaves() {
    const outline = d3.line().curve(d3.curveCatmullRomClosed.alpha(1))

    const descendantsSubGroup1 = root.descendants().filter((d) => d.depth === 1)
    const descendantsSubGroup2 = root.descendants().filter((d) => d.depth === 2)
    const descendantsSubGroup3 = root.descendants().filter((d) => d.depth === 3)
    svg
      .select("g.leaves")
      .selectAll(".leaf")
      .data(descendantsSubGroup1)
      .join("path")
      .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d, w, h))) + "Z")
      .classed("leaf leaf-1", true)
    svg
      .select("g.leaves-2")
      .selectAll(".leaf")
      .data(descendantsSubGroup2)
      .join("path")
      .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d, w, h))) + "Z")
      .classed("leaf-2 leaf", true)
      .on("click", (e, d) => console.log("Petalo del ramo", d.ancestors()))
    // svg
    //   .select("g.leaves-3")
    //   .selectAll(".leaf")
    //   .data(descendantsSubGroup3)
    //   .join("path")
    //   .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d, w, h))) + "Z")
    //   .classed("leaf-2 leaf", true)
  }

  function drawNodes(nodes) {
    console.log("update")
    svg
      .select("g.nodes")
      .selectAll("circle.node")
      .data(nodes)
      .join("circle")
      .classed("node", true)
      .attr("id", (d) => `mail-${d.data.mail}`)
      .attr("cx", (d) => w / 2 + d.computedX)
      .attr("cy", (d) => h / 2 + d.computedY)
      .attr("r", (d) => 0)
      .attr("stroke", "black")

    svg
      .select("g.nodes")
      .selectAll("text.node-label")
      .data(nodes, (d, i) => `label-${d.depth}-${d.data[0]}-${i}`)
      .join("text")
      .classed("node-label", true)
      .text((d) => d.data[0])
      .attr("id", (d, i) => `label-${d.depth}-${d.data[0]}-${i}`)
      .attr("x", (d, i) => w / 2 + d.computedX + (i % 10))
      .attr("y", (d, i) => h / 2 + d.computedY + (i % 10))
      .attr("transform", `rotate(${-40})`)
      .attr("visibility", (d) => (d.depth === 1 ? "visible" : "hidden"))
  }

  function drawLinks() {
    const radialLineGen = d3
      .linkRadial()
      .angle((d) => d.x)
      .radius((d) => d.y)
    // draw links
    svg
      .select("g.links")
      .selectAll("path.link")
      .data(root.links())
      .join("path")
      .classed("link", true)
      .attr("d", (d) => d.target.depth !== 5 && radialLineGen(d))
      .attr("opacity", (d) => 0.8 / d.target.depth)
      .attr("fill", "none")
      .attr("transform", `translate(${w / 2}, ${h / 2})`)
      .attr("stroke-dasharray", `0 100`)
      .attr("path-length", 100)
      .attr("stroke-width", 1)
  }

  function drawPetals() {
    const petals = root.descendants().filter((d) => d.depth === root.height - 2)
    console.log("petals", petals)

    svg
      .select("g.petal-values")
      .selectAll("g.petal-values-group")
      .data(petals)
      .join("g")
      .classed("petal-values-group", true)

      .attr("transform", function (d) {
        const petalEndNodes = d.descendants().filter((nd) => nd.depth === d.height + d.depth)
        if (petalEndNodes.length > 0) {
          // Compute average position -> middle point
          const avgX = d3.mean(petalEndNodes, (nd) => nd.computedX)
          const avgY = d3.mean(petalEndNodes, (nd) => nd.computedY)
          return `translate(${w / 2 + avgX}, ${h / 2 + avgY})`
        }
      })
      .each(function (d) {
        d3.select(this).selectAll("*").remove()
        const petalEndNodes = d.descendants().filter((nd) => nd.depth === d.height + d.depth)
        if (petalEndNodes.length === 0) return

        // Collect all skills for all end nodes
        const allSkills = []
        petalEndNodes.forEach((nd) => {
          nd.data.skills.forEach((skill) => {
            allSkills.push({
              name: skill.name,
              proficency: +skill.proficency,
              interest: +skill.interest,
            })
          })
        })

        // Find the skill with the highest proficiency (winner)
        const winnerProfSkill = allSkills.reduce(
          (max, curr) => (curr.proficency > max.proficency ? curr : max),
          allSkills[0]
        )

        // Find the skill with the highest interest (winner)
        const winnerIntSkill = allSkills.reduce(
          (max, curr) => (curr.interest > max.interest ? curr : max),
          allSkills[0]
        )

        // Distance offset between the two shapes
        const offset = 12

        // Draw winner proficiency as a circle (at center, shifted left)
        d3.select(this)
          .append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", scales.sizePetals(winnerProfSkill.proficency) + 2)
          .attr("fill", scales.color(winnerProfSkill.name))
          .attr("opacity", 0.9)
          .attr("stroke", "#222")
          .attr("stroke-width", 0.5)

        d3.select(this)

          .append("text")
          .classed("petal-label", true)
          .text((d) => "Testo")

          .attr("x", 0)
          .attr("y", 0)

        // Draw winner interest as a rounded rectangle (at center, shifted right)
        const rectSide = scales.sizePetals(winnerIntSkill.interest) * 3
        d3.select(this)
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", rectSide)
          .attr("height", rectSide)
          .attr("rx", 2)
          .attr("ry", 2)
          .attr("fill", scales.color(winnerIntSkill.name))
          .attr("opacity", 0.7)
          .attr("stroke", "#333")
          .attr("stroke-width", 0.5)
          .attr("transform", ` translate(${rectSide / 2}, ${-rectSide / 2}), rotate(${45})`)
      })
  }

  //   function drawLollipop() {
  //     // console.log(nodes)
  //     const nodes = root.descendants().filter((d) => d.depth === root.height)

  //     svg
  //       .select("g.lollipops")
  //       .selectAll("g.lollipop-group")
  //       .data(nodes, (d) => d.data.mail)
  //       .join("g")
  //       .classed("lollipop-group", true)
  //       .attr("transform", (d) => `translate(${w / 2 + d.computedX}, ${h / 2 + d.computedY})`)
  //       .each(function (d) {
  //         // Remove previous petals if any
  //         d3.select(this).selectAll("*").remove()

  //         // For each skill, draw a lollipop (line + two dots)
  //         d.data.skills.forEach((skill, i) => {
  //           const angle = (i / d.data.skills.length) * 2 * Math.PI - Math.PI / 2
  //           const profRadius = scales.size(skill.proficency)
  //           const intRadius = scales.size(skill.interest)
  //           const profDist = distanceScale(skill.proficency)
  //           const intDist = distanceScale(skill.interest)

  //           // Line from center to further of the two points
  //           const maxDist = Math.max(profDist, intDist)
  //           const x2 = Math.cos(angle) * maxDist
  //           const y2 = Math.sin(angle) * maxDist

  //           d3.select(this)
  //             .append("line")
  //             .attr("x1", 0)
  //             .attr("y1", 0)
  //             .attr("x2", x2)
  //             .attr("y2", y2)
  //             .attr("stroke", "black")
  //             // .attr("stroke", scales.color(skill.name))
  //             .attr("stroke-width", 1)
  //             .attr("opacity", 1)

  //           // Proficiency dot
  //           d3.select(this)
  //             .append("circle")
  //             .attr("cx", x2)
  //             .attr("cy", y2)
  //             .attr("r", profRadius)
  //             .attr("fill", scales.color(skill.name))
  //             .attr("opacity", 0.5)
  //             .classed("petal-element", true)

  //           // Interest dot (slightly different color or stroke)
  //           d3.select(this)
  //             .append("rect")
  //             .attr("width", intRadius)
  //             .attr("height", intRadius)
  //             .attr("rx", 1)
  //             .attr("ry", 1)
  //             .attr("x", Math.cos(angle) * intDist - intRadius / 2)
  //             .attr("y", Math.sin(angle) * intDist - intRadius / 2)
  //             .attr("r", intRadius)
  //             .attr("fill", scales.color(skill.name))
  //             .attr("opacity", 0.5)
  //             .attr("stroke", "#333")
  //             .attr("stroke-width", 1)
  //             .classed("petal-element", true)
  //         })
  //       })
  //   }

  function updateChart(endNodes) {
    // svg
    //   .select("g.nodes")
    //   .selectAll("circle.node")
    //   .data(endNodes)
    //   .join("circle")
    //   .classed("node", true)
    //   .on("click", function (e, d) {
    //     d3.select(this).style("fill", "red")
    //     const x = +d3.select(this).attr("cx")
    //     const y = +d3.select(this).attr("cy")
    //     const k = 3

    //     d3.select("svg")
    //       .transition()
    //       .call(zoom.transform, d3.zoomIdentity.scale(k).translate(-x + w / k / 2, -y + w / k / 2))
    //   })
    //   .transition()
    //   .duration(animationDuration)

    //   .ease(d3.easeLinear)
    //   .delay((d, i) => d.depth * delay + i * offset)
    //   .attr("r", (d) => 2)
    // .attr("fill", (d) => (d.data.topic ? color(d.data.topic) : ""))

    svg
      .select("g.links")
      .selectAll("path.link")
      .data(root.links())
      .join("path")
      .classed("link", true)
      .transition()
      .duration(animationDuration)
      .ease(d3.easeLinear)
      .delay((d, i) => d.source.depth * delay + i * offset)
      .attr("stroke", "red")
      .attr("stroke-dasharray", `${100} ${0}`)
  }
}

function getAllDescendantCoordsD3(node, w, h) {
  const childrenPoints = node.descendants().map((d) => [d.computedX + w / 2, d.computedY + h / 2])

  return childrenPoints
}
