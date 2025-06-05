export function fillDataFields(node, scales) {
  const name = document.querySelector("#name")
  name.innerHTML = node.data.name
  //   const role = document.querySelector("#role")
  //   role.innerHTML = node.data.role
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
