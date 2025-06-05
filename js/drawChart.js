import { polarToCartesian } from "./utils/utils.js"
import { createBreadcrumbsFromNode } from "./fillDataFields.js"

export function drawChart(root, scales, svg, w, h, isSafari) {
  // const endNodes = root.descendants().filter((d) => d.depth === root.height)

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

  // updateChart(endNodes)

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
    // svg
    //   .select("g.leaves")
    //   .selectAll(".leaf")
    //   .data(descendantsSubGroup1)
    //   .join("path")
    //   .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d, w, h))) + "Z")
    //   .classed("leaf leaf-1", true)
    //   .attr("opacity", 0)
    //   .transition()
    //   .duration(animationDuration)
    //   .ease(d3.easeLinear)
    //   .delay((d, i) => i * 20)
    //   .attr("opacity", 1)
    // // .attr("stroke", isSafari ? "var(--purple-30)" : "")

    svg
      .select("g.leaves-2")
      .selectAll(".leaf")
      .data(descendantsSubGroup2)
      .join("path")
      .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d, w, h))) + "Z")
      .classed("leaf-2 leaf", true)
      .on("click", (e, d) => console.log("Petalo del ramo", createBreadcrumbsFromNode(d)))
      .attr("opacity", 0)
      .transition()
      .duration(animationDuration)
      .ease(d3.easeLinear)
      .delay((d, i) => i * 20)
      .attr("opacity", 1)
      .attr("stroke", isSafari ? "var(--purple-30)" : "")
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
      // .attr("transform", `rotate(${-40})`)
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
      .transition()
      .duration(animationDuration)
      .ease(d3.easeLinear)
      .delay((d, i) => d.source.depth * delay + i * offset)
      .attr("stroke", "red")
      .attr("stroke-dasharray", `${100} ${0}`)
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
      .attr("opacity", 0)
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
          .text(winnerProfSkill.proficency)
          .attr("x", -13)
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

        d3.select(this)
          .append("text")
          .classed("petal-label", true)
          .text(winnerProfSkill.interest)
          .attr("x", 8)
          .attr("y", 7)
          .attr("transform", ` translate(${rectSide / 2}, ${-rectSide / 2})`)

        d3.select(this)
          .append("text")
          .classed("petal-label", true)
          .text("Highest Scores")
          .attr("x", 0)
          .attr("y", 20)
      })
      .transition()
      .duration(animationDuration)
      .ease(d3.easeLinear)
      .delay((d, i) => 1000 + i * 20)
      .attr("opacity", "1")
  }
}

function getAllDescendantCoordsD3(node, w, h) {
  const childrenPoints = node.descendants().map((d) => [d.computedX + w / 2, d.computedY + h / 2])

  return childrenPoints
}
