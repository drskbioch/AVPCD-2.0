// Plain-language names for the fields and values shown on the pages. Pages never show a column name from the database:
// they go through this file. Fields without an entry in FIELDS are not shown.

export const GROUPS = ["Potency", "Compound", "Plant", "Virus and assay", "Cytotoxicity", "Source"];

// key, label, group
export const FIELDS = [
  ["compound_name", "Compound", "Compound"],
  ["is_derivative", "Derivative", "Compound"],
  ["isolation", "Origin of the sample", "Compound"],
  ["inchikey", "InChIKey", "Compound"],
  ["smiles", "SMILES", "Compound"],
  ["pubchem_cid", "PubChem CID", "Compound"],
  ["compound_resolution_status", "Structure match", "Compound"],

  ["plant_species", "Plant species", "Plant"],
  ["plant_part", "Plant part", "Plant"],
  ["plant_family", "Plant family", "Plant"],
  ["ncbi_taxid", "NCBI taxon ID", "Plant"],
  ["plant_resolution_status", "Taxon match", "Plant"],
  ["plant_provenance_level", "Plant provenance", "Plant"],

  ["virus_verbatim", "Virus as printed", "Virus and assay"],
  ["strain", "Strain or isolate", "Virus and assay"],
  ["variant", "Mutant or variant", "Virus and assay"],
  ["ictv_species", "Virus species (ICTV)", "Virus and assay"],
  ["ictv_family", "Virus family (ICTV)", "Virus and assay"],
  ["genome_type", "Genome type", "Virus and assay"],
  ["virus_host", "Host group", "Virus and assay"],
  ["virus_resolution_rank", "Virus match level", "Virus and assay"],
  ["assay_type", "Assay type", "Virus and assay"],
  ["cell_line", "Cell line or system", "Virus and assay"],
  ["target", "Target", "Virus and assay"],

  ["endpoint", "Endpoint", "Potency"],
  ["relation", "Relation", "Potency"],
  ["value_raw", "Value as printed", "Potency"],
  ["value_upper_raw", "Upper value of a range", "Potency"],
  ["unit_raw", "Unit as printed", "Potency"],
  ["value_nM", "Value (nM)", "Potency"],
  ["converted", "Converted to nM", "Potency"],
  ["value_conversion_note", "Conversion note", "Potency"],
  ["dispersion", "Spread", "Potency"],
  ["dose_response_reported", "Dose-response shown", "Potency"],

  ["cytotoxicity_reported", "Cytotoxicity reported", "Cytotoxicity"],
  ["cc50_value", "CC50", "Cytotoxicity"],
  ["cc50_unit", "CC50 unit", "Cytotoxicity"],
  ["cc50_same_cell_line", "CC50 in the same cell line", "Cytotoxicity"],
  ["si_reported", "Selectivity index", "Cytotoxicity"],

  ["pmid", "PMID", "Source"],
  ["paper_link", "Paper", "Source"],
  ["source_location", "Printed in", "Source"],
  ["source_detail", "Table or page", "Source"],
];

export const FIELD = Object.fromEntries(FIELDS.map(([key, label, group]) => [key, { key, label, group }]));

export const PAPER_FIELDS = [["title", "Title"], ["journal", "Journal"], ["year", "Year"], ["pmid", "PMID"], ["doi", "DOI"]];

// The one data-quality flag that is shown on a record: a warning about the recorded unit.
export const UNIT_FLAG = { name: "unit_conflict_benchmark", label: "Unit to check", hint: "The recorded unit may be 1,000 times away from the unit in the paper." };

const MAPS = {
  isolation: { isolated_in_paper: "Isolated in the paper", purchased: "Purchased standard", cited: "Cited from earlier work" },
  plant_resolution_status: {
    resolved: "Species", resolved_genus_only: "Genus only", unresolved: "Not matched", not_queried_unspecified: "Not looked up (plant unspecified)",
    not_queried_multiple_or_crude: "Not looked up (several plants or crude extract)", not_queried_abbreviated_genus: "Not looked up (abbreviated genus)",
  },
  virus_resolution_rank: { species: "Species", genus: "Genus", family: "Family", "virus-like-unmapped": "Not matched", multiple_viruses: "Several viruses" },
  virus_host: { human: "Human", animal: "Animal", unknown: "Unknown", plant: "Plant", bacteriophage: "Bacteriophage", other: "Other" },
  source_location: { text: "Text", table: "Table" },
  assay_type: { "cell-based": "Cell-based", enzyme: "Enzyme", pseudovirus: "Pseudovirus", replicon: "Replicon", "in vivo": "In vivo" },
};
const YES_NO = new Set(["is_derivative", "converted", "dose_response_reported", "cytotoxicity_reported", "cc50_same_cell_line"]);

function sentence(text) {
  const s = String(text).replaceAll("_", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Display text of one value of one field. Free text, identifiers and numbers are returned unchanged.
export function prettyValue(key, value) {
  const v = value ?? "";
  if (v === "") return "";
  if (YES_NO.has(key)) return v === "y" ? "Yes" : v === "n" ? "No" : v;
  if (MAPS[key]) return MAPS[key][v] ?? sentence(v);
  if (key === "plant_provenance_level" || key === "compound_resolution_status") return sentence(v);
  return v;
}

// Statistics and filters key their counts by field; this gives the label of one bucket.
export function bucketLabel(key, name) {
  return name === "" ? "Not recorded" : prettyValue(key, name) || "Not recorded";
}
