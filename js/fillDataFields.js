export function fillDataFields(node, scales) {
  createBreadcrumbsFromNode(node)
  const name = document.querySelector("#name")
  name.style.display = "block"
  name.innerHTML = node.data.name
  //   const country = document.querySelector("#country")
  //   country.innerHTML = node.data.country
  //   const topic = document.querySelector("#topic")
  //   topic.innerHTML = node.data.topic
  //   const experience = document.querySelector("#experience")
  //   experience.innerHTML = node.data.experience

  //   const skillsDiv = document.querySelector("#skills")
  //   skillsDiv.innerHTML = "" // Clear previous skills

  //   node.data.skills.forEach((d) => {
  //     const skillElem = document.createElement("p")
  //     skillElem.classList.add("skill-field")
  //     skillElem.style.color = scales.color(d.name)

  //     skillElem.textContent = `${d.name}: `
  //     const skillSpan = document.createElement("span")
  //     skillSpan.textContent = ` Interest ${d.interest}, Proficiency ${d.proficency}`
  //     skillSpan.style.color = "black"

  //     skillElem.appendChild(skillSpan)
  //     skillsDiv.appendChild(skillElem)
  //   })
}

export function createBreadcrumbsFromNode(node) {
  const name = document.querySelector("#name")
  name.innerHTML = ""
  name.style.display = "none"
  const crumbs = document.querySelector("#breadcrumbs")
  crumbs.style.display = "block"
  crumbs.innerHTML = ""
  const labels = ["Topic", "Role", "IDx exp."]

  console.log(node.ancestors())
  // Get ancestors, skip the root (first element), and reverse the order
  const ancestors = node.ancestors().reverse().slice(1)

  console.log(ancestors)
  ancestors.forEach((ancestor, idx) => {
    const container = document.createElement("div")
    container.style.display = "inline-block"
    container.style.marginRight = "4px"

    const labelSpan = document.createElement("span")
    labelSpan.textContent = labels[idx] || ""
    labelSpan.style.display = "block"
    labelSpan.style.fontSize = "0.8em"
    labelSpan.style.color = "#888"

    const valueSpan = document.createElement("span")
    valueSpan.textContent = ancestor.data[0]
    valueSpan.style.display = "block"

    container.appendChild(labelSpan)
    container.appendChild(valueSpan)
    crumbs.appendChild(container)

    if (idx < ancestors.length - 1) {
      const sep = document.createElement("span")
      sep.textContent = " > "
      sep.style.margin = "0 4px"
      crumbs.appendChild(sep)
    }
  })
}
