import { cleanDataset } from "./js/cleanData.js"
import { drawChart } from "./js/drawChart.js"
import { fillDataFields } from "./js/fillDataFields.js"
import { drawLollipops } from "./js/drawLollipops.js"

// Global variables
const spreadsheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3gMntpLSHq5OWJ3XOYK9ViLX5V3Zea9QQJkrJccbyGnPSRps0oeeERGOhQ5v9saMUbEB3L9bLWYaR/pub?output=csv"
const fakeSpreadsheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1Ixj7B6jtD60PeCTaDQtJ02Af9F2du7Peir9-uS7g5g6EObctBZY__NL5nXVZucxHix_y589RCa0f/pub?output=csv"
const localURL = "survey_data.csv"

const w = window.innerWidth
const h = window.innerHeight
// const w = 700
// const h = 700

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

let currentRawData = []
let zoomLevel = 0

const zoomThreshold = 3
// let prevDataLen

const zoom = d3.zoom().scaleExtent([0.5, 10]).on("zoom", zoomed)

const loadingDiv = d3.select("#loading").style("visibility", "block")

const svg = d3
  .select("#badge-visualization")
  .attr("width", w)
  .attr("height", h)
  .call(zoom)
  .select("g")
  .style("opacity", 0)

const reloadModal = d3.select("#reload-modal").style("display", "none")

function zoomed(e) {
  const { x, y, k } = e.transform
  zoomLevel = k

  // Toggle labels based on zoom level
  const showLabels = k > zoomThreshold
  d3.selectAll(".petal-label, .node-label").style("opacity", showLabels ? 1 : 0)

  // Always apply transform - D3 handles the limits
  svg.attr("transform", e.transform)
}

function zoomToNode(root, scales) {
  const mailInput = d3.select("#mail-input")
  const originalMail = mailInput.nodes()[0].value
  const selctedMail = originalMail.replaceAll("@", "-").replaceAll(".", "-").toLowerCase()

  console.log(selctedMail)
  const node = d3.select(`#mail-${selctedMail}`)
  console.log(node)
  const x = +node.attr("cx")
  const y = +node.attr("cy")
  const k = 3

  d3.select("svg").call(
    zoom.transform,
    d3.zoomIdentity.scale(k).translate(-x + w / k / 2, -y + h / k / 2)
  )

  // Find the node with the matching mail in the hierarchy
  const selectedNode = root.descendants().find((d) => d.data.mail && d.data.mail === selctedMail)

  if (selectedNode) {
    mailInput.classed("hidden", "true")
    drawLollipops(svg, [selectedNode], scales, { w, h })
    fillDataFields(selectedNode, scales)
  } else {
    console.warn("Node not found for:", selctedMail)
  }
}

currentRawData.length === 0 && fetchAndDraw()

const interval = 30000
setInterval(() => {
  console.log("Refresh")
  fetchAndDraw()
}, interval)

function fetchAndDraw() {
  d3.csv(fakeSpreadsheetURL).then((rawData) => {
    svg.style("opacity", "1")
    loadingDiv.style("visibility", "hidden")
    if (currentRawData.length === 0) draw()
    else if (rawData.length !== currentRawData.length) {
      // Attivo pulsante / modal che mi fa
      reloadModal
        .style("display", "flex")
        .style("opacity", 0)
        .transition()
        .duration(300)
        .style("opacity", 1)
      reloadModal.on("click", function () {
        d3.select(this).transition().duration(300).style("opacity", 0).style("display", "none")
        draw()
      })
    }

    function draw() {
      currentRawData = rawData
      console.log(rawData.length)

      const cleanData = cleanDataset(rawData)
      console.log("clean data: ", cleanData)

      const root = createHierarchy(cleanData)

      const scales = computeScales(cleanData)
      const buttonInput = d3.select("#input-button").on("click", () => zoomToNode(root, scales))
      d3.select("#mail-input").on("keydown", function (event) {
        if (event.key === "Enter") {
          zoomToNode(root, scales)
        }
      })

      // TODO se i dati sono diversi (rawData.length) dai precedenti chiama
      drawChart(root, scales, svg, w, h, isSafari)
    }
  })
}

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
    "#45B7D1", // Sky Blue
    "#33AA80", // Warm Yellow
    "#BB8FCE", // Light Purple
    "#F7DC6F", // Banana Yellow
    "#F8C471", // Peach
    "#82E0AA", // Light Green
  ]

  const skillExtent = [1, 5]

  const uniqueSkills = data[0].skills.map((d) => d.name)
  console.log("unique skills", uniqueSkills)

  const sizeScale = d3.scaleLinear().domain(skillExtent).range([1, 10])
  const sizeScalePetals = d3.scaleLinear().domain(skillExtent).range([1, 5])
  const distanceScale = d3.scaleLinear().domain(skillExtent).range([5, 30])
  const distanceScale2 = d3.scaleLinear().domain(skillExtent).range([2, 10])
  const skillColor = d3.scaleOrdinal(uniqueSkills, colorPalette)

  const scales = {
    size: sizeScale,
    sizePetals: sizeScalePetals,
    distance: distanceScale,
    distance2: distanceScale2,
    color: skillColor,
  }
  legendCreation(uniqueSkills, skillColor)

  return scales
}

function legendCreation(uniqueSkills, skillColor) {
  const legendContainer = d3
    .select("#color-legend")
    .selectAll("span")
    .data(uniqueSkills)
    .join("span")
    .classed("color-element", true)
    .html((d) => d)
    .style("background-color", (d) => skillColor(d))
}
