// Plain-language names for the fields, values and flags of a record. Pages never show a column name from the database:
// they go through this file. Fields without an entry in FIELDS are not shown (internal bookkeeping).

// key, label, group, description, added (true = derived or added by AVPCD, not copied from the paper)
export const GROUPS = ["Compound", "Plant", "Virus and assay", "Potency", "Cytotoxicity", "Source", "Cross-references", "Notes and flags"];

export const FIELDS = [
  ["compound_name", "Compound", "Compound", "Name of the compound as printed in the paper.", false],
  ["is_derivative", "Derivative", "Compound", "Whether the compound is a semisynthetic derivative or a synthetic analogue of a plant compound.", false],
  ["isolation", "Origin of the sample", "Compound", "Whether the compound was isolated in the paper, bought as a standard, or cited from earlier work.", false],
  ["inchikey", "InChIKey", "Compound", "Structure identifier matched to the compound name by database lookup. Empty when no structure was found. The match was not checked by hand.", true],
  ["smiles", "SMILES", "Compound", "Structure of that match as a SMILES string.", true],
  ["pubchem_cid", "PubChem CID", "Compound", "PubChem compound number, when the structure came from PubChem.", true],
  ["compound_resolution_status", "Structure match", "Compound", "How the name was matched to a structure, or why it was not.", true],

  ["plant_species", "Plant species", "Plant", "Source plant as printed in the paper (standardised). Purchased standards have no plant.", false],
  ["plant_part", "Plant part", "Plant", "Part of the plant the compound was isolated from.", false],
  ["plant_family", "Plant family", "Plant", "Family in the NCBI Taxonomy lineage of the plant.", true],
  ["ncbi_taxid", "NCBI taxon ID", "Plant", "NCBI Taxonomy identifier of the plant species, or of its genus when only the genus could be matched.", true],
  ["plant_resolution_status", "Taxon match", "Plant", "Whether the plant name was matched to a species, to a genus only, or not at all.", true],
  ["plant_provenance_level", "Plant provenance", "Plant", "Whether the plant is named in the record. When it is not, whether a plant was found for the compound in an external database; that tells where the compound occurs in general, not the plant of the assay sample.", true],

  ["virus_verbatim", "Virus as printed", "Virus and assay", "Virus name exactly as printed in the paper.", false],
  ["strain", "Strain or isolate", "Virus and assay", "Strain, isolate or subtype as printed.", false],
  ["variant", "Mutant or variant", "Virus and assay", "Drug-resistant mutant or named variant, when the value belongs to one.", false],
  ["ictv_species", "Virus species (ICTV)", "Virus and assay", "ICTV species matched to the virus name. Empty when only the genus or family could be matched.", true],
  ["ictv_family", "Virus family (ICTV)", "Virus and assay", "ICTV family of the matched virus.", true],
  ["genome_type", "Genome type", "Virus and assay", "Genome type of the matched virus.", true],
  ["virus_host", "Host group", "Virus and assay", "Whether the virus infects humans, animals or other hosts. Assigned from a project list, not from ICTV.", true],
  ["virus_resolution_rank", "Virus match level", "Virus and assay", "How precisely the virus name could be matched: species, genus or family.", true],
  ["assay_type", "Assay type", "Virus and assay", "Cell-based, enzyme, replicon, pseudovirus or in vivo assay. Cell-based and target-based results are different things.", false],
  ["cell_line", "Cell line or system", "Virus and assay", "Host cell line or test system as printed.", false],
  ["target", "Target", "Virus and assay", "Protein or enzyme target as printed.", false],

  ["endpoint", "Endpoint", "Potency", "IC50, EC50, IC90, EC90 or ED50.", false],
  ["relation", "Relation", "Potency", "How the value relates to the number printed: equal, greater than, less than, or a range.", false],
  ["value_raw", "Value as printed", "Potency", "The number exactly as printed (the lower end of a range).", false],
  ["value_upper_raw", "Upper value of a range", "Potency", "Upper end of a range, in the same unit.", false],
  ["unit_raw", "Unit as printed", "Potency", "Unit exactly as printed. It is never changed.", false],
  ["value_nM", "Value (nM)", "Potency", "The value in nanomolar. Molar units are scaled; mass units are converted with the molecular weight of the matched structure. Empty when no conversion was possible.", true],
  ["converted", "Converted to nM", "Potency", "Whether the nanomolar value was converted from a mass concentration.", true],
  ["value_conversion_note", "Conversion note", "Potency", "Why the nanomolar value is present or empty.", true],
  ["dispersion", "Spread", "Potency", "Standard deviation or error and number of replicates, as printed.", false],
  ["dose_response_reported", "Dose-response shown", "Potency", "Whether the paper shows a concentration series behind the value.", false],

  ["cytotoxicity_reported", "Cytotoxicity reported", "Cytotoxicity", "Whether the paper reports a CC50-type value for this compound and assay.", false],
  ["cc50_value", "CC50", "Cytotoxicity", "CC50, TC50 or CD50 as printed. It is not a potency value.", false],
  ["cc50_unit", "CC50 unit", "Cytotoxicity", "Unit of the CC50 as printed.", false],
  ["cc50_same_cell_line", "CC50 in the same cell line", "Cytotoxicity", "Whether the CC50 was measured in the same cell line and assay as the antiviral value.", false],
  ["si_reported", "Selectivity index", "Cytotoxicity", "Selectivity index exactly as the paper states it.", false],

  ["record_id", "Record ID", "Source", "Stable identifier of the record in this release.", true],
  ["pmid", "PMID", "Source", "PubMed identifier of the paper the value comes from.", false],
  ["paper_link", "Paper", "Source", "DOI link of the paper, or its PubMed page when it has no DOI.", true],
  ["evidence_tier", "Where the value was read", "Source", "Full text: read in the full paper. Abstract: read from the abstract only. Unclear: not yet ruled on.", true],
  ["source_location", "Printed in", "Source", "Whether the value was printed in the text or in a table. Values read from figures are not included.", false],
  ["source_detail", "Table or page", "Source", "Table, page or section label of the source, as printed.", false],

  ["novelty_status", "Novelty", "Cross-references", "Result of comparing compound, virus and value with NPASS and ChEMBL. Some records cannot be tested.", true],
  ["novelty_npass_ids", "NPASS compound IDs", "Cross-references", "NPASS compound identifiers of matching entries (identifiers only).", true],
  ["novelty_npass_pmids", "PMIDs cited in NPASS", "Cross-references", "PubMed identifiers of the papers behind those NPASS entries.", true],
  ["novelty_chembl_molecules", "ChEMBL molecule IDs", "Cross-references", "ChEMBL molecule identifiers of matching entries (identifiers only).", true],
  ["novelty_chembl_docs", "ChEMBL document IDs", "Cross-references", "ChEMBL document identifiers of those entries.", true],

  ["tags", "Tags", "Notes and flags", "Curator tags: algal source, derivatives only, or surrogate system.", false],
  ["flags", "Curator flags", "Notes and flags", "Notes by the curators on the value, such as approximate or reported inactive.", false],
  ["data_quality_flags", "Data quality flags", "Notes and flags", "Possible problems found by checks after curation. A flag does not mean the value is wrong, and no flag does not mean it was checked.", true],
  ["notes", "Curator notes", "Notes and flags", "Free-text notes by the curators.", false],
];

export const FIELD = Object.fromEntries(FIELDS.map(([key, label, group, desc, added]) => [key, { key, label, group, desc, added }]));
export const fieldLabel = (key) => FIELD[key]?.label ?? null;

export const PAPER_FIELDS = [["title", "Title"], ["journal", "Journal"], ["year", "Year"], ["pmid", "PMID"], ["doi", "DOI"]];

const FLAGS = {
  possible_duplicate: ["Possible duplicate", "Shares paper, compound, virus, cell line, endpoint, value and unit with another record."],
  in_vivo_with_ic50: ["In vivo with IC50 or EC50", "An in vivo assay recorded with an IC50 or EC50 endpoint."],
  surrogate_untagged: ["Surrogate system not tagged", "A pseudovirus, replicon or enzyme assay without the surrogate-system tag."],
  value_to_check: ["Value to check", "The value is outside 1 pM to 1 mM, or is in mass units and could not be converted."],
  origin_unresolved: ["Source tier unconfirmed", "Whether the value was read from the full text or from the abstract has not been ruled on."],
  unit_conflict_benchmark: ["Unit to check", "The recorded unit may be 1,000 times away from the unit in the paper."],
};
export const flagLabel = (name) => FLAGS[name]?.[0] ?? sentence(name);
export const flagHint = (name) => FLAGS[name]?.[1] ?? "";

const CURATOR_FLAGS = {
  approx: "Approximate value", inactive: "Reported inactive", type_assumed: "Type assumed", source_conflict: "Sources disagree",
  stereo_unspecified: "Stereochemistry not specified", cc50_cell_mismatch: "CC50 in a different cell line",
};
const TAGS = { algae: "Algal source", derivative_only: "Derivatives only", surrogate_system: "Surrogate system" };

const MAPS = {
  evidence_tier: { full_text: "Full text", abstract: "Abstract", unclear: "Unclear" },
  novelty_status: {
    newly_curated: "Newly curated", matches_npass_and_chembl: "In NPASS and ChEMBL", matches_chembl: "In ChEMBL", matches_npass: "In NPASS",
    unresolvable_compound: "Not testable: no structure", unresolvable_virus: "Not testable: virus not matched", value_untestable: "Not testable: no comparable value",
  },
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
  if (key === "flags") return v.split(";").filter(Boolean).map((x) => CURATOR_FLAGS[x] ?? sentence(x)).join(", ");
  if (key === "tags") return v.split(";").filter(Boolean).map((x) => TAGS[x] ?? sentence(x)).join(", ");
  return v;
}

// Statistics and filters key their counts by field; this gives the label of one bucket.
export function bucketLabel(key, name) {
  if (key === "data_quality_flags" || key === "data_quality_flag") return name === "none" ? "No flag" : flagLabel(name);
  return name === "" ? "Not recorded" : prettyValue(key, name) || "Not recorded";
}
