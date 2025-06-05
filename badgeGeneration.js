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

const zoomThreshold = 3
// let prevDataLen

const zoom = d3.zoom().scaleExtent([0.5, 10]).on("zoom", zoomed)

const loadingDiv = d3.select("#loading").style("visibility", "block")

const svg = d3.select("#badge-visualization").attr("width", w).attr("height", h).call(zoom)
const svgGroup = svg.select("g").style("opacity", 0)

const reloadModal = d3.select("#reload-modal").style("display", "none")

function zoomed(e) {
  const { x, y, k } = e.transform

  // Toggle labels based on zoom level
  const showLabels = k > zoomThreshold
  d3.selectAll(".petal-label, .node-label").style("opacity", showLabels ? 1 : 0)

  // Always apply transform - D3 handles the limits
  svgGroup.attr("transform", e.transform)
}

function getMailAddress(root) {
  const mailInput = d3.select("#mail-input")
  const originalMail = mailInput.nodes()[0].value
  const selectedMail = originalMail.replaceAll("@", "-").replaceAll(".", "-").toLowerCase()

  const selectedNode = root.descendants().find((d) => d.data.mail && d.data.mail === selectedMail)

  if (!selectedNode) {
    mailInput.classed("wrong", true)
    // alert("Email not found in the dataset.")
    return null
  }

  return selectedMail
}

function zoomToNode(mail, root, scales) {
  const node = d3.select(`#mail-${mail}`)

  const x = +node.attr("cx")
  const y = +node.attr("cy")
  const k = 3

  smoothZoomTo(x, y, k)

  function smoothZoomTo(x, y, scale = 2) {
    svg
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(w / 2, h / 2)
          .scale(scale)
          .translate(-x, -y)
      )
  }

  // Find the node with the matching mail in the hierarchy
  const selectedNode = root.descendants().find((d) => d.data.mail && d.data.mail === mail)

  if (selectedNode) {
    d3.select("#mail-input").classed("hidden", "true")
    drawLollipops(svgGroup, [selectedNode], scales, { w, h })
    fillDataFields(selectedNode, scales)
  } else {
    console.warn("Node not found for:", mail)
  }
}

currentRawData.length === 0 && fetchAndDraw()

const interval = 30000
setInterval(() => {
  fetchAndDraw()
}, interval)

function fetchAndDraw() {
  d3.csv(spreadsheetURL).then((rawData) => {
    svgGroup.style("opacity", "1")
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

      const cleanData = cleanDataset(rawData)

      const root = createHierarchy(cleanData)

      const scales = computeScales(cleanData)
      const buttonInput = d3.select("#input-button")
      buttonInput.on("click", () => buttonClick())
      d3.select("#mail-input").on("keydown", function (event) {
        if (event.key === "Enter") {
          buttonClick()
        }
      })

      function buttonClick() {
        const mail = getMailAddress(root)
        if (mail) {
          buttonInput.text("Go to your badge")
          buttonInput.classed("")
          zoomToNode(mail, root, scales)
        }
      }

      drawChart(root, scales, svgGroup, w, h, isSafari)
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

  return root
}

function computeScales(data) {
  // Define a color palette
  const colorPalette = [
    "var(--s-red)",
    "var(--s-blue)",
    "var(--s-green)",
    "var(--s-purple)",
    "var(--s-yellow)",
    "var(--s-orange)",
    "var(--s-lightgreen)",
  ]

  const skillExtent = [1, 5]

  const uniqueSkills = data[0].skills.map((d) => d.name)

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
