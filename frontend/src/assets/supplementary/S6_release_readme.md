# AVPCD release v0.1 (DRAFT, accuracy measured as a range)

**Status: DRAFT 2026-10-26.** The records are *curated*. Accuracy was measured on a 150-record benchmark sample (105 papers, 8 strata of a 1,763-record frame) read by two independent field experts; no third reader decided where they disagreed. The result is therefore a range: 95.7% to 99.2% of the checked fields are correct (95% interval 93.4% to 99.9%), and 78.6% to 96.9% of the records have every checked field correct (95% interval 68.2% to 99.5%); stratified to the frame. The 90% record-level target of the plan can therefore be neither confirmed nor rejected from these data. Recall and the accuracy of compound-name resolution (on which the novelty status depends) were not measured. Method and results: `methods/benchmark_report.md`. Records outside the sample have not been checked by an independent person, and no record is marked as checked.
The column `method_as_recorded` reproduces the curation method string exactly as it stands in the curation workbook; it describes how a record was
produced and is not evidence of independent checking.

## What this is
Antiviral potency values (IC50, EC50, IC90, EC90, ED50) of plant-derived compounds, copied from 553 papers into 1988 records of a curation workbook;
this package holds the **1,731 records of the headline scope** (the waterfall in `waterfall.csv` and `methods/scope_waterfall.md` shows how 1,988 became 1,731:
reference drugs, single-concentration % inhibition rows, derivatives, plant-virus assays and one confirmed duplicate are left out).
Evidence tier: full text 858, abstract 838, unclear 35.

## Curation process
Records were extracted by four curators from assigned paper sets with AI-tool assistance (tools not fully documented; AI outputs were not retained) and curator review. Screening was by title and abstract. [Curator-reported, not independently verified. Details pending.]

## Files
`avpcd_v0.1.sqlite3` (tables: records, papers, compounds, plant_provenance, waterfall, near_matches_rejected, data_dictionary, meta) and the same tables as CSV.
`data_dictionary.csv` explains every column of `records` and says whether it is recorded in the workbook, derived, or added by the release.

## What is included
Recorded fields (copied unchanged from the curation workbook); evidence tier; derived identifiers (InChIKey and SMILES by name lookup in PubChem, NCI CACTUS, COCONUT 2.0, LOTUS and the NPASS name table;
NCBI Taxonomy id and family; ICTV species and family; molar values); the novelty status with database **ids only**; the plant-provenance level; the resolution status.

## What is not included
No NPASS or ChEMBL value (only NPASS compound ids and PMIDs, ChEMBL molecule and document ids); no abstract and no full text of any paper; no annotator files;
no curator identifiers; no record outside the headline scope (they stay in the curation workbook); no hand-checked structure.

## Licence plan (a proposal for the project lead to confirm; nothing here is legal advice)
Proposed: our curated records and derived columns under CC BY 4.0. Third-party material is used as follows: PubChem and NCBI data are public; COCONUT 2.0 and LOTUS are CC0;
NPASS is CC BY-NC, so only its ids and PMIDs appear; ChEMBL is CC BY-SA 3.0, so only its ids appear; the ICTV species list and the paper metadata are cited, not redistributed in bulk.
**Open before any release:** the licence status of the text processing for papers outside licence tier A. 1,168 of the 1,731 records come from papers that are not CC BY / CC0 open access
(the curation workbook rules allow AI-assisted checking only for tier A); the project lead has to confirm how these were produced before the package is shared.

## Known limits
- **Accuracy is a range, not a single figure.** Records with every checked field correct: 78.6% to 96.9%; fields: 95.7% to 99.2% (stratified to the 1,763-record frame, 95% intervals in `methods/benchmark_report.md`). Of the 150 sampled records, 83 were confirmed by both experts on every checked field, 43 were supported by one expert, 15 remain unresolved between the two experts and 9 were contradicted. For the records the novelty tables list as newly curated, the record-level range is 74.2% to 95.6%. Not measured: recall, compound-name resolution, records outside the frame.
- **Name-resolution audit not done.** The audit workbook was prepared but not filled; the accuracy of the name-to-structure matches is not measured.
- **Compound identity is a name lookup.** 1,179 of 1,731 records (68.1%) have a structure; the rest are unresolved or paper-local labels (Compound 7). Matches were not checked by hand.
  Near matches were rejected entirely (ruling R002: at least 7 of 15 were wrong); they are listed in `near_matches_rejected.csv`.
- **Virus:** ICTV species for 1,658 records (95.8%); the rest genus or family only.
- **Plant:** species or genus resolved for 1,287 records; 392 records have no plant species in the record
  (from assay paper 6, compound-level external database 367, none found 19). Compound-level provenance is not the plant of the assay sample.
- **Novelty is a lower and an upper bound:** newly curated 1,015 (lower), up to 1,638 (upper); 623 records cannot be tested (compound 552, virus 63, value 8).
  The test is 14-character InChIKey block + ICTV species + value within 10%, endpoint-agnostic; ChEMBL misses assays whose target is a host cell; v1 is compared at compound level only.
- **Open rulings:** one record has an empty is_derivative, ruled `unclear` (R001, pending adjudication); 47 workbook records have an origin (full text or abstract) pending a ruling, 44 of them in this release (flag `origin_unresolved`).
- **AI outputs were not retained.** The outputs of the AI tools used during curation were not kept, so the extraction route cannot be reconstructed from the record.
- **Process details are curator-reported.** The description under "Curation process" comes from the curators and has not been independently verified; the individual curator statements are pending.

## Data quality notes
These are statements of what the checks found; none of them changed a curated value. Counts are for the 1,988 records of the curation workbook unless the text says "in this release" (1,731 records).
Records with a flag: 345 of 1,731. The flags are in the column `data_quality_flags` of `records` (semicolon-separated): possible_duplicate 27, in_vivo_with_ic50 0, surrogate_untagged 120, value_to_check 189, origin_unresolved 44, unit_conflict_benchmark 10.
A flag marks a possible problem. It does not say that the recorded value is wrong, and a record without a flag has not been checked either.
- **Surrogate-system tag.** 59 pseudovirus or replicon rows and 99 enzyme rows have no `surrogate_system` tag in `tags` (the tag was not added; `assay_type` is recorded). Flag `surrogate_untagged`: 120 records in this release.
- **In vivo rows with a potency endpoint.** 15 rows have `assay_type` in vivo together with the endpoint IC50 or EC50 (0 in this release). Flag `in_vivo_with_ic50`.
- **Duplicate groups.** 20 groups of records share the same paper, compound, virus, cell line, endpoint, value and unit. In 19 groups the records differ in another column (strain, target, dispersion, inhibition_pct and so on); in 1 group (PMID 17890069) two records are extra copies of a third, recorded as a confirmed duplicate and left out of the release scope. Nothing was deleted from the workbook. Flag `possible_duplicate` marks membership of such a group in the workbook: 14 of the 20 groups have records in this release (27 records); the other 6 groups consist only of records outside the release scope. A flagged record's partner may be outside the release.
- **Unit conflict found by the benchmark.** The experts read a unit 1,000 times away from the curated unit, with the same number (curated mg/mL or mM, read ug/mL or uM), for 7 of the 7 sampled records on three part-2 papers (PMIDs 15467245, 17015965, 18670115). These papers hold 10 curated test records; 7 were checked and 3 were not. Flag `unit_conflict_benchmark`: 10 records in this release. No curated value was changed; treat the potency of flagged records as unreliable until the papers are re-read (`methods/benchmark_unit_fault.csv`).
- **Paper-level counts.** 21 papers have an `n_potency_values` entry that differs from the number of reported records of the paper in the workbook (`audit_problems.csv` in the project lists them). This is a paper-level check and has no record flag.
- **Values to re-read.** 46 values are outside 1 pM to 1 mM and 171 mass-unit values had no molecular weight when `value_nM` was derived (`values_to_check.csv` in the project). Flag `value_to_check`: 189 records in this release.
- **Europe PMC records without a PMID.** 79 Europe PMC records without a PMID were found by the search and were never screened or curated; none is in this release or in the 2,621-paper pool.
- The kept record of the confirmed duplicate group is in this release and carries `possible_duplicate`; its two extra copies are outside the scope (see `waterfall.csv`).

## Citation
See `CITATION.cff` (placeholder). Version 0.1-draft, 2026-10-26.
