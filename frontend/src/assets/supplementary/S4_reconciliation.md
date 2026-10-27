# Reconciliation of release v0.1 (every line asserted by 23_build_release_v01.py)

| check | result | detail |
|---|---|---|
| records table = headline scope | PASS | 1731 |
| waterfall final line = records | PASS | 1731 |
| waterfall: 1988 - exclusions = remaining | PASS | 257 excluded |
| evidence tiers sum to records | PASS | {'full_text': 858, 'unclear': 35, 'abstract': 838} |
| evidence tiers = waterfall per-tier (858 / 838 / 35) | PASS | {'full_text': 858, 'unclear': 35, 'abstract': 838} |
| novelty statuses sum to records | PASS | {'newly_curated': 1015, 'unresolvable_compound': 552, 'matches_chembl': 35, 'matches_npass_and_chembl': 58, 'unresolvable_virus': 63, 'value_untestable': 8} |
| novelty: newly curated 1,015 | PASS | 1015 |
| novelty: untestable 623, upper bound 1,638 | PASS | untestable 623 |
| record ids unique | PASS |  |
| no record is a reference drug, % inhibition row, derivative, plant-virus row or confirmed duplicate | PASS |  |
| curated cells equal the enriched file (plant_species, compound_name, value_raw, unit_raw) | PASS |  |
| no NPASS/ChEMBL value column | PASS |  |
| no field except method_as_recorded, notes and source_detail carries an independent-check status word | PASS |  |
| rejected near matches = 15 | PASS |  |
| R001 and R002 are recorded | PASS |  |
| flag: pseudovirus/replicon rows without surrogate_system tag = 59 | PASS | 59 in the workbook |
| flag: enzyme rows without surrogate_system tag = 99 | PASS | 99 in the workbook |
| flag: in vivo rows with IC50/EC50 = 15 | PASS | 15 in the workbook, 0 in the release |
| flag: key-level duplicate groups = 20 | PASS | 20 groups in the workbook, 14 with a record in the release (the other 6 consist only of records outside the release scope) |
| flag: value_to_check = values_to_check.csv (46 out of range + 171 mass unit without MW) | PASS | {'mass_unit_no_molecular_weight': 171, 'out_of_range_value': 46} |
| flag: origin_unresolved = origin_to_adjudicate.csv without a ruling (47) | PASS | 47 in the workbook, 44 in the release |
| flag: papers where n_potency_values differs from the record count = 21 (audit_problems.csv) | PASS | 21 |
| flag: Europe PMC records without a PMID, never screened = 79 | PASS | 79 |
| flag: release flag counts + flags outside the release scope = workbook counts | PASS |  |
| flag: unit_conflict_benchmark = benchmark_unit_fault.csv (10 curated test records on 3 papers, all in the workbook) | PASS | 10 in the workbook, 10 in the release |
| flag: flag names are the six allowed names | PASS | {'value_to_check', 'possible_duplicate', 'origin_unresolved', 'surrogate_untagged', 'in_vivo_with_ic50', 'unit_conflict_benchmark'} |
| flag: flagged column counts in the records table equal the recomputed release counts | PASS | {'value_to_check': 189, 'origin_unresolved': 44, 'in_vivo_with_ic50': 0, 'surrogate_untagged': 120, 'possible_duplicate': 27, 'unit_conflict_benchmark': 10} |
| sqlite table records = CSV rows | PASS | 1731 vs 1731 |
| sqlite table papers = CSV rows | PASS | 553 vs 553 |
| sqlite table compounds = CSV rows | PASS | 588 vs 588 |
| sqlite table plant_provenance = CSV rows | PASS | 670 vs 670 |
| sqlite table waterfall = CSV rows | PASS | 8 vs 8 |
| sqlite table near_matches_rejected = CSV rows | PASS | 15 vs 15 |
| sqlite table data_dictionary = CSV rows | PASS | 105 vs 105 |
| sqlite table meta = CSV rows | PASS | 9 vs 9 |

## Row counts per table

| table | rows (SQLite) | rows (CSV) |
|---|---|---|
| records | 1731 | 1731 |
| papers | 553 | 553 |
| compounds | 588 | 588 |
| plant_provenance | 670 | 670 |
| waterfall | 8 | 8 |
| near_matches_rejected | 15 | 15 |
| data_dictionary | 105 | 105 |
| meta | 9 | 9 |

Waterfall: 1,988 - 257 = 1,731.
Evidence tiers: {'full_text': 858, 'unclear': 35, 'abstract': 838}.
Novelty statuses: {'newly_curated': 1015, 'unresolvable_compound': 552, 'matches_chembl': 35, 'matches_npass_and_chembl': 58, 'unresolvable_virus': 63, 'value_untestable': 8}.