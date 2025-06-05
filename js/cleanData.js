export function cleanDataset(rawData) {
  console.log("RawData: ", rawData)
  return rawData.map((d) => ({
    mail: d["Email address"].replace("@", "-").replaceAll(".", "-").toLowerCase(),
    name: d["Name"],
    city: d["City "] === "" ? "Not specified" : d["City "],
    country: d["Country of residence"],
    inpat: d["Do you live in your country of origin? "] === "yes" ? 1 : 0,
    role: d["What best describes your role?"],
    employer:
      d["Employer / Company Name / University"] === ""
        ? "Not specified"
        : d["Employer / Company Name / University"],
    topic: d["Which of our topics are you most drawn to?"],
    experience:
      d["What is your level of experience in information design / data visualisation?"] ===
      "I'm interested in finding work related to information design / data visualisation"
        ? "Interest"
        : d["What is your level of experience in information design / data visualisation?"] ===
          "I am currently working on information design / data visualisation"
        ? "Just a project"
        : d["What is your level of experience in information design / data visualisation?"],
    skills: [
      {
        name: "Data Analisys",
        proficency: d["Proficiency – Data analysis"],
        interest: d["Interest – Data analysis"],
      },
      {
        name: "Data Journalism",
        proficency: d["Proficiency – Data journalism"],
        interest: d["Interest – Data journalism"],
      },
      {
        name: "Storytelling",
        proficency: d["Proficiency – Storytelling"],
        interest: d["Interest – Storytelling"],
      },
      {
        name: "Research",
        proficency: d["Proficiency – Research"],
        interest: d["Interest – Research"],
      },
      {
        name: "Use of AI Tools",
        proficency: d["Proficiency – Use of AI Tools"],
        interest: d["Interest – Use of AI Tools"],
      },
      {
        name: "Art and Graphic Design",
        proficency: d["Proficiency – Art and graphic design "],
        interest: d["Interest – Art and graphic design "],
      },
    ],
  }))
}
