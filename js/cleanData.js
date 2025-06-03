export function cleanDataset(rawData) {
  console.log("RawData: ", rawData)

  return rawData.map((d) => ({
    mail: d.mail.replace("@", "-").replace(".", "-").toLowerCase(),
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
}
