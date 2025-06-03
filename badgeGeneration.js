const spreadsheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJlYdfj_WRjc4vIkaPsATqb0J48N17MU2g2zT4G28tyGl2p366fx29SpZJyO7JlCUax_F5FWzg6zVF/pub?output=csv"

const localURL = "survey_data.csv"

// const w = window.innerWidth
// const h = window.innerHeight
const w = 700
const h = 700

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

// let selectedMail

// const mailInput = d3
//   .select("#mail-input")
//   .on("input", (e) => ((selectedMail = e.target.value), console.log(selectedMail)))

const buttonInput = d3.select("#input-button").on("click", () => zoomToNode())

const zoom = d3.zoom().on("zoom", zoomed)
// svg = svg.call(zoom).select("g")

const svg = d3
  .select("#badge-visualization")
  .attr("width", w)
  .attr("height", h)
  .call(zoom)
  .select("g")
// .attr("transform", `translate(${w / 2}, ${h / 2})`)

function zoomed(e) {
  const { x, y, k } = e.transform
  svg.attr("transform", "translate(" + x + "," + y + ")" + " scale(" + k + ")")
}

function zoomToNode() {
  const selctedMail = d3.select("#mail-input").nodes()[0].value.replace("@", "-").replace(".", "-")
  console.log(selctedMail)
  const node = d3.select(`#mail-${selctedMail}`)
  console.log(node)
  const x = +node.attr("cx")
  const y = +node.attr("cy")
  const k = 3

  d3.select("svg")
    .transition()
    .call(zoom.transform, d3.zoomIdentity.scale(k).translate(-x + w / k / 2, -y + w / k / 2))
}

d3.csv(localURL).then((rawData) => {
  console.log(rawData)

  const cleanData = rawData.map((d) => ({
    mail: d.mail.replace("@", "-").replace(".", "-"),
    name: d.name,
    city: d.city === "" ? "Not specified" : d.city,
    country: d["country of residence"],
    inpat: d["lives in country of residence"] === "yes" ? 1 : 0,
    role: d["role"],
    employer:
      d["Employer Name / University"] === "" ? "Not specified" : d["Employer Name / University"],
    topic: d["Topic of Interest"],
    experience: d["Level of Experience in Data Viz"],

    skills: [
      {
        name: "Data Analisys",
        proficency: d["Proficency – Data Analysis"],
        interest: d["Interest – Data Analysis"],
      },
      {
        name: "Data Journalism",
        proficency: d["Proficency – Data Journalism"],
        interest: d["Interest – Data Journalism"],
      },
      {
        name: "Storytelling",
        proficency: d["Proficency – Storytelling"],
        interest: d["Interest – Storytelling"],
      },
      {
        name: "Research",
        proficency: d["Proficency – Research"],
        interest: d["Interest – Research"],
      },
      {
        name: "Use of AI Tools",
        proficency: d["Proficency – Use of AI Tools"],
        interest: d["Interest – Use of AI Tools"],
      },
      {
        name: "Art and Graphic Design",
        proficency: d["Proficency – Art and Graphic Design"],
        interest: d["Interest – Art and Graphic Design"],
      },
    ],
  }))

  console.log(cleanData)

  const treeDataRollup = d3.rollup(
    cleanData,
    (D) => D,
    (d) => d.topic,
    (d) => d.role,
    (d) => d.experience
    // (d) => d.inpat
    // (d) => d.mail

    // (d) => d.skills
    // (d) => d.country
    // (d) => d.design,
    // (d) => d.interest
  )

  const root = d3.hierarchy(treeDataRollup)

  console.log("root", root)
  console.log("descendants", root.descendants())
  console.log("links", root.links())

  const uniqueTopics = _.uniq(cleanData.map((d) => d.topic))
  console.log("unique topics", uniqueTopics)

  const color = d3.scaleOrdinal(uniqueTopics, colorPalette)

  const uniqueRoles = _.uniq(cleanData.map((d) => d.role))
  console.log("unique roles", uniqueRoles)

  const uniqueSkills = cleanData[0].skills.map((d) => d.name)
  console.log("unique skills", uniqueSkills)

  const sizeScale = d3.scaleLinear().domain([1, 5]).range([1, 5])
  const distanceScale = d3.scaleLinear().domain([1, 5]).range([5, 15])

  const skillColor = d3.scaleOrdinal(uniqueSkills, colorPalette)

  // const n_first_level_nodes = root.descendants().filter((d) => d.depth === 1)

  // console.log("First level nodes: ", n_first_level_nodes.length)
  // console.log("Second level nodes: ", root.descendants().filter((d) => d.depth === 2).length)
  // console.log("Third level nodes: ", root.descendants().filter((d) => d.depth === 3).length)
  // console.log("Last level nodes: ", root.descendants().filter((d) => d.depth === 4).length)

  // const radialScale = d3.scaleLinear([0, n_first_level_nodes.length], [0, 2 * Math.PI])

  const animationDuration = 800
  const delay = 500
  const leafDelay = 200

  const offset = 0

  const radius = 250
  const treeLayout = d3.cluster().size([2 * Math.PI, radius])

  //TODO Compute it
  const depths = [0, 1, 2, 3, 4]

  const circlesRadii = d3.scaleLinear([0, root.height], [10, treeLayout.size()[1]])

  treeLayout(root)

  // Helper function to convert polar coordinates to cartesian
  const polarToCartesian = (angle, radius) => {
    // const angleRad = (angle * Math.PI) / 180
    return {
      x: radius * Math.sin(angle),
      y: -radius * Math.cos(angle), // negative because SVG y-axis is flipped
    }
  }

  // Add computed x,y coordinates to each node
  root.descendants().forEach((d) => {
    const coords = polarToCartesian(d.x, d.y)
    d.computedX = coords.x
    d.computedY = coords.y
  })

  // console.log(root.descendants())

  const maxDepth = 4

  let descendantsByDepth = []

  for (let i = 0; i <= maxDepth; i++) {
    descendantsByDepth[i] = root.descendants().filter((d) => d.depth === i)
  }

  console.log("DBD", descendantsByDepth)

  const descendantsSubGroup1 = root.descendants().filter((d) => d.depth === 1)
  const descendantsSubGroup2 = root.descendants().filter((d) => d.depth === 2)
  const descendantsSubGroup3 = root.descendants().filter((d) => d.depth === 3)
  console.log(descendantsSubGroup2)

  // const node = descendantsSubGroup[2]
  // console.log("Node", node)

  // Get a specific node (e.g., by some criteria)
  // const specificNode = root.descendants().find((d) => d.data.name === "someNodeName")

  function getAllDescendantCoordsD3(node) {
    // console.log(node.descendants())
    // const thisNodePoints = [node.computedX + w / 2, node.computedY + h / 2]
    // console.log(thisNodePoints)
    const childrenPoints = node.descendants().map((d) => [d.computedX + w / 2, d.computedY + h / 2])

    // childrenPoints.push([w / 2, h / 2])

    // console.log(childrenPoints)
    return childrenPoints
  }

  // const points = getAllDescendantCoordsD3(node)

  // console.log("Points", points)

  // const hull = d3.polygonHull(points)

  const outline = d3.line().curve(d3.curveCatmullRomClosed.alpha(1))

  const petals = root.descendants().filter((d) => d.depth === root.height - 2)
  console.log("petals", petals)

  const endNodes = root.descendants().filter((d) => d.depth === root.height)
  console.log("end nodes", endNodes)

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
  // .attr("transform", (d) => `translate(${w / 2}, ${h / 2}), scale(${d === 0 ? 1 : 0})`)
  svg
    .select("g.leaves")
    .selectAll(".leaf")
    .data(descendantsSubGroup1)
    .join("path")
    .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d))) + "Z")
    // .attr("d", "M0 0 L0 0 L0 0 Z")
    // .attr("fill", (d) => color(d.data))
    .classed("leaf leaf-1", true)
  svg
    .select("g.leaves-2")
    .selectAll(".leaf")
    .data(descendantsSubGroup2)
    .join("path")
    .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d))) + "Z")
    // .attr("d", "M0 0 L0 0 L0 0 Z")
    // .attr("fill", (d) => color(d.data))
    .classed("leaf-2 leaf", true)
  // .attr("transform", `translate(${w / 2}, ${h / 2}), scale(0)`)
  svg
    .select("g.leaves-3")
    .selectAll(".leaf")
    .data(descendantsSubGroup3)
    .join("path")
    .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d))) + "Z")
    // .attr("d", "M0 0 L0 0 L0 0 Z")
    // .attr("fill", (d) => color(d.data))
    .classed("leaf-2 leaf", true)
  // .attr("transform", `translate(${w / 2}, ${h / 2}), scale(0)`)

  svg
    .select("g.nodes")
    .selectAll("circle.node")
    .data(endNodes)
    .join("circle")
    .classed("node", true)
    .attr("id", (d) => `mail-${d.data.mail}`)
    .attr("cx", (d) => w / 2 + d.computedX)
    .attr("cy", (d) => h / 2 + d.computedY)
    .attr("r", (d) => 0)
    .attr("stroke", "black")
  // .on("click", (e, d) => (console.log(d), zoomToItem(d.computedX, d.computedY)))

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
    .append("circle")
    .attr("fill", "red")
    .attr("r", "2")
    .each((d) => {
      // Remove previous petals if any
      d3.select(this).selectAll("*").remove()
    })

  svg
    .select("g.lollipops")
    .selectAll("g.lollipop-group")
    .data(endNodes, (d) => d.data.mail)
    .join("g")
    .classed("lollipop-group", true)
    .attr("transform", (d) => `translate(${w / 2 + d.computedX}, ${h / 2 + d.computedY})`)
    .each(function (d) {
      // Remove previous petals if any
      d3.select(this).selectAll("*").remove()

      // For each skill, draw a lollipop (line + two dots)
      d.data.skills.forEach((skill, i) => {
        const angle = (i / d.data.skills.length) * 2 * Math.PI - Math.PI / 2
        const profRadius = sizeScale(skill.proficency)
        const intRadius = sizeScale(skill.interest)
        const profDist = distanceScale(skill.proficency)
        const intDist = distanceScale(skill.interest)

        // Line from center to further of the two points
        const maxDist = Math.max(profDist, intDist)
        const x2 = Math.cos(angle) * maxDist
        const y2 = Math.sin(angle) * maxDist

        d3.select(this)
          .append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("stroke", "black")
          // .attr("stroke", skillColor(skill.name))
          .attr("stroke-width", 1)
          .attr("opacity", 1)

        // Proficiency dot
        d3.select(this)
          .append("circle")
          .attr("cx", Math.cos(angle) * profDist)
          .attr("cy", Math.sin(angle) * profDist)
          .attr("r", profRadius)
          .attr("fill", skillColor(skill.name))
          .attr("opacity", 0.5)
          .classed("petal-element", true)

        // Interest dot (slightly different color or stroke)
        d3.select(this)
          .append("circle")
          .attr("cx", Math.cos(angle) * intDist)
          .attr("cy", Math.sin(angle) * intDist)
          .attr("r", intRadius)
          .attr("fill", skillColor(skill.name))
          .attr("opacity", 0.5)
          .attr("stroke", "#333")
          .attr("stroke-width", 1)
          .classed("petal-element", true)
      })
    })

  // .data(petals.data.skills)
  // .attr("r", (d) => 0)
  // .attr("stroke", "black")
  // .on("click", (e, d) => console.log(d))

  radialLayout()

  // function linkGen() {
  //   return d3
  //     .linkRadial()
  //     .angle((d) => (d.x * Math.PI) / 180)
  //     .radius((d) => d.y)
  // }
  function radialLayout() {
    svg
      .select("g.circles")
      .selectAll(".circle")
      .data(depths)
      .join("circle")
      .transition()
      .duration(animationDuration)
      .delay((d, i) => i * delay)

      .ease(d3.easeLinear)
      // .attr("opacity", 0.5)
      // .attr("fill", (d) => (d === 0 ? "url(#grad1)" : "url(#grad2)"))

      .attr("transform", ` scale(1)`)

    // svg.select("g.leaves").selectAll(".leaf").data(descendantsSubGroup).join("path")
    // .transition()
    // .duration(animationDuration)
    // .delay((d, i) => i * leafDelay)
    // .ease(d3.easeLinear)
    // .attr("d", (d) => outline(d3.polygonHull(getAllDescendantCoordsD3(d))) + "Z")

    // draw nodes
    // svg
    //   .select("g.nodes")
    //   .selectAll("circle.node")
    //   .data(petals)
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
    svg
      .select("g.nodes")
      .selectAll("circle.node")
      .data(endNodes)
      .join("circle")
      .classed("node", true)
      .on("click", function (e, d) {
        d3.select(this).style("fill", "red")
        const x = +d3.select(this).attr("cx")
        const y = +d3.select(this).attr("cy")
        const k = 3

        d3.select("svg")
          .transition()
          .call(zoom.transform, d3.zoomIdentity.scale(k).translate(-x + w / k / 2, -y + w / k / 2))
      })
      .transition()
      .duration(animationDuration)

      .ease(d3.easeLinear)
      .delay((d, i) => d.depth * delay + i * offset)
      .attr("r", (d) => 2)
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
})

// function updateNodes() {
//   const u = svg
//     .selectAll("circle")
//     .data(root.descendants())
//     .join("circle")
//     .classed("data-point", true)

//     .attr("r", 5)
//     .attr("cx", (d, i) => (d.depth !== 1 ? d.x : Math.cos(radialScale(i - 1)) * 100))
//     .attr("cy", (d, i) => (d.depth !== 1 ? d.y : Math.sin(radialScale(i - 1)) * 100))

//     .on("click", (_e, d) => console.log(d))
// }

// function updateLinks() {
//   const p = svg
//     .selectAll(".links")
//     .data(root.links())
//     .join("line")
//     .classed("links", true)
//     .attr("x1", (d) => d.source.x)
//     .attr("y1", (d) => d.source.y)
//     .attr("x2", (d) => d.target.x)
//     .attr("y2", (d) => d.target.y)
// }

// function ticked() {
//   updateLinks()
//   updateNodes()
// }

// function lineGen() {
//   return d3
//     .lineRadial()
//     .angle((d) => (d.x * Math.PI) / 180)
//     .radius((d) => d.y)
// }
