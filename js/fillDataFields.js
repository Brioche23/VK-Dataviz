export function fillDataFields(node, scales) {
  createBreadcrumbsFromNode(node)
  const name = d3.select("#name")
  name.classed("cta", false)
  name.style("display", "block")
  name.text(node.data.name)
}

export function createBreadcrumbsFromNode(node) {
  const name = document.querySelector("#name")
  name.innerHTML = ""
  name.style.display = "none"
  const crumbs = document.querySelector("#breadcrumbs")
  crumbs.style.display = "block"
  crumbs.innerHTML = ""
  const labels = ["Topic", "Role", "IDx exp."]

  // Get ancestors, skip the root (first element), and reverse the order
  const ancestors = node.ancestors().reverse().slice(1)

  ancestors.forEach((ancestor, idx) => {
    // Add total count of final children (leaf nodes) for this ancestor
    const leafCount = ancestor
      .descendants()
      .filter((d) => !d.children || d.children.length === 0).length

    const container = document.createElement("div")
    container.style.display = "inline-block"
    container.style.marginRight = "4px"

    const labelSpan = document.createElement("span")
    labelSpan.classList.add("label")
    labelSpan.textContent = labels[idx] || ""

    const textP = document.createElement("p")
    textP.classList.add("value")

    const valueSpan = document.createElement("span")
    valueSpan.classList.add("value")

    const valueText = ancestor.data[0] ?? "Yourself"
    valueSpan.textContent = valueText

    const countSpan = document.createElement("span")
    countSpan.classList.add("count")
    countSpan.textContent = ` ${leafCount}`

    textP.appendChild(valueSpan)
    textP.appendChild(countSpan)

    container.appendChild(labelSpan)
    container.appendChild(textP)
    crumbs.appendChild(container)

    if (idx < ancestors.length - 1) {
      const sep = document.createElement("span")
      sep.textContent = " > "
      sep.style.margin = "0 4px"
      crumbs.appendChild(sep)
    }
  })
}
