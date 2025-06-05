export function drawLollipops(svg, nodes, scales, dimensions) {
  const { w, h } = dimensions

  const lollipopGroups = svg
    .select("g.lollipops")
    .selectAll("g.lollipop-group")
    .data(nodes, (d) => d.data.mail)
    .join(
      // ENTER: New node groups
      (enter) => {
        const groups = enter
          .append("g")
          .classed("lollipop-group", true)
          .attr("transform", (d) => `translate(${w / 2 + d.computedX}, ${h / 2 + d.computedY})`)
          .style("opacity", 0)

        const polygonPoints = calculateAllCoordinates(nodes, scales, dimensions)

        const lineGen = d3
          .line()
          .x((d) => d.x)
          .y((d) => d.y)
          .curve(d3.curveCardinalClosed.tension(0.6))

        const pathString = lineGen(polygonPoints)
        // polygonPoints.reduce((path, point, i) => {
        //   return (
        //     path +
        //     (i === 0
        //       ? `M ${point.x},${point.y}`
        //       : ` C ${point.x + 1},${point.y + 1} ${point.x},${point.y} ${point.x - 1},${
        //           point.y - 1
        //         }`)
        //   )
        // }, "") + " Z"

        // BG Polygon
        groups
          .append("path")
          .classed("hex", true)
          .attr("d", pathString)

          .style("opacity", 0)
          .transition()
          .duration(800)
          .ease(d3.easeQuadInOut)
          .style("opacity", 1)

        // Create skill groups for new nodes
        createSkillGroups(groups)

        return groups
          .transition()
          .duration(800)
          .delay((d, i) => i * 200)
          .ease(d3.easeQuadInOut)
          .style("opacity", 1)
      },

      // UPDATE: Existing node groups
      (update) => {
        // Update position
        const updatedGroups = update
          .transition()
          .duration(600)
          .ease(d3.easeQuadInOut)
          .attr("transform", (d) => `translate(${w / 2 + d.computedX}, ${h / 2 + d.computedY})`)

        // Update skill groups without recreation
        updateSkillGroups(update, scales)

        return updatedGroups
      },

      // EXIT: Remove node groups
      (exit) => {
        return (
          exit
            .transition()
            .duration(500)
            .ease(d3.easeBackIn)
            .style("opacity", 0)
            //   .style("transform", "scale(0)")
            .remove()
        )
      }
    )

  return lollipopGroups

  // Helper function to create skill groups for new nodes
  function createSkillGroups(nodeGroups) {
    nodeGroups.each(function (d) {
      const group = d3.select(this)

      // Get all the outer points

      const skillGroups = group
        .selectAll(".skill-group")
        .data(d.data.skills, (skill) => skill.name)
        .enter()
        .append("g")
        .classed("skill-group", true)
        .attr("data-skill", (skill) => skill.name)

      // Add elements to each skill group
      skillGroups.each(function (skill, i) {
        const skillGroup = d3.select(this)
        const coords = calculateCoordinates(skill, i, d.data.skills.length, scales)

        // Line
        skillGroup
          .append("line")
          .classed("lollipop-line", true)
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 0)
          .attr("stroke-width", 0.1)
          .attr("opacity", 0)
          .transition()
          .duration(600)
          .delay(i * 50)
          .ease(d3.easeQuadInOut)
          .attr("x2", coords.line.x)
          .attr("y2", coords.line.y)
          .attr("opacity", 1)
          .attr("stroke-width", 0.5)

        // Proficiency dot
        skillGroup
          .append("circle")
          .classed("proficiency-dot", true)
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", 0)
          .attr("fill", scales.color(skill.name))
          .attr("opacity", 0)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5)
          .transition()
          .duration(400)
          .delay(300 + i * 50)
          .ease(d3.easeQuadInOut)
          .attr("cx", coords.circle.x)
          .attr("cy", coords.circle.y)
          .attr("r", coords.circle.r)
          .attr("opacity", 1)

        // Interest square
        skillGroup
          .append("rect")
          .classed("interest-square", true)
          .attr("width", 0)
          .attr("height", 0)
          .attr("rx", 1)
          .attr("ry", 1)
          .attr("x", 0)
          .attr("y", 0)
          .attr("fill", scales.color(skill.name))
          .attr("opacity", 0)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5)
          .transition()
          .duration(400)
          .delay(350 + i * 50)
          .ease(d3.easeQuadInOut)
          .attr("width", coords.square.size)
          .attr("height", coords.square.size)
          .attr("x", coords.square.x)
          .attr("y", coords.square.y)
          .attr("opacity", 1)
      })
    })
  }

  // Helper function to update existing skill groups
  function updateSkillGroups(nodeGroups, scales) {
    nodeGroups.each(function (d) {
      const group = d3.select(this)

      const skillGroups = group
        .selectAll(".skill-group")
        .data(d.data.skills, (skill) => skill.name)
        .join(
          // New skills
          (enter) => {
            const newSkillGroups = enter
              .append("g")
              .classed("skill-group", true)
              .attr("data-skill", (skill) => skill.name)

            newSkillGroups.each(function (skill, i) {
              const skillGroup = d3.select(this)
              const coords = calculateCoordinates(skill, i, d.data.skills.length, scales)

              addSkillElements(skillGroup, skill, coords, scales)
            })

            return newSkillGroups
          },

          // Update existing skills
          (update) => {
            update.each(function (skill, i) {
              const skillGroup = d3.select(this)
              const coords = calculateCoordinates(skill, i, d.data.skills.length, scales)

              // Update line
              skillGroup
                .select("line")
                .transition()
                .duration(400)
                .delay(i * 30)
                .attr("x2", coords.line.x)
                .attr("y2", coords.line.y)

              // Update circle
              skillGroup
                .select(".proficiency-dot")
                .transition()
                .duration(300)
                .delay(150 + i * 30)
                .ease(d3.easeBackOut)
                .attr("cx", coords.circle.x)
                .attr("cy", coords.circle.y)
                .attr("r", coords.circle.r)
                .attr("fill", scales.color(skill.name))

              // Update square
              skillGroup
                .select(".interest-square")
                .transition()
                .duration(300)
                .delay(200 + i * 30)
                .ease(d3.easeBackOut)
                .attr("width", coords.square.size)
                .attr("height", coords.square.size)
                .attr("x", coords.square.x)
                .attr("y", coords.square.y)
                .attr("fill", scales.color(skill.name))
            })

            return update
          },

          // Remove skills
          (exit) => {
            return exit.transition().duration(300).style("opacity", 0).remove()
          }
        )
    })
  }

  // Helper function to calculate coordinates for a skill
  function calculateCoordinates(skill, index, totalSkills, scales, padding) {
    const angle = (index / totalSkills) * 2 * Math.PI - Math.PI / 2
    const profRadius = scales.size(skill.proficency)
    const intRadius = scales.size(skill.interest)
    const profDist = scales.distance(skill.proficency)
    const intDist = scales.distance(skill.interest)
    const maxDist = scales.distance(5)

    return {
      hex: {
        x: Math.cos(angle) * (maxDist + padding),
        y: Math.sin(angle) * (maxDist + padding),
      },
      line: {
        x: Math.cos(angle) * maxDist,
        y: Math.sin(angle) * maxDist,
      },
      circle: {
        x: Math.cos(angle) * profDist,
        y: Math.sin(angle) * profDist,
        r: profRadius,
      },
      square: {
        x: Math.cos(angle) * intDist - intRadius / 2,
        y: Math.sin(angle) * intDist - intRadius / 2,
        size: intRadius,
      },
    }
  }

  // Calculate all maxDist coordinates for polygon creation
  function calculateAllCoordinates(nodes, scales, dimensions) {
    const { w, h } = dimensions
    const allCoords = []
    const padding = 6

    nodes.forEach((node) => {
      // const nodeX = w / 2 + node.computedX
      // const nodeY = h / 2 + node.computedY

      node.data.skills.forEach((skill, index) => {
        const coords = calculateCoordinates(skill, index, node.data.skills.length, scales, padding)

        // Add absolute coordinates of the line endpoints (maxDist points)
        allCoords.push({
          x: 0 + coords.hex.x,
          y: 0 + coords.hex.y,
        })
      })
    })

    return allCoords
  }

  // Helper function to add skill elements (for new skills)
  function addSkillElements(skillGroup, skill, coords, scales) {
    // Line
    skillGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", coords.line.x)
      .attr("y2", coords.line.y)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("opacity", 1)

    // Circle
    skillGroup
      .append("circle")
      .classed("proficiency-dot", true)
      .attr("cx", coords.circle.x)
      .attr("cy", coords.circle.y)
      .attr("r", coords.circle.r)
      .attr("fill", scales.color(skill.name))
      .attr("opacity", 1)

    // Square
    skillGroup
      .append("rect")
      .classed("interest-square", true)
      .attr("width", coords.square.size)
      .attr("height", coords.square.size)
      .attr("rx", 1)
      .attr("ry", 1)
      .attr("x", coords.square.x)
      .attr("y", coords.square.y)
      .attr("fill", scales.color(skill.name))
      .attr("opacity", 1)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
  }
}
