# Scope waterfall: 1,988 records to the 1,731 headline scope

Report only. Exclusions are applied in the order shown (a record is counted at the first rule that catches it); the stand-alone column counts what each rule would remove on its own, so overlaps are visible. Clause texts are from `analysis/phase3/annotation_guideline.md`. The rules are those used for `auto_headline_scope` in `enriched_records.csv` (`12_enrich_build.py`).

## All records

| step | exclusion | stand-alone | new at this step | remaining | authorised by |
|---|---|---|---|---|---|
| start | all records in the frozen workbook |  |  | 1988 |  |
| - 144 | role = reference (positive controls and reference drugs) | 144 | 144 | 1844 | Guideline section 3: reference drugs and positive controls are stored with role = reference and excluded from all counts of plant-derived records |
| - 46 | value_status = pct_inhibition (single-concentration % inhibition) | 46 | 46 | 1798 | Decision Q8 and section 4: single-concentration % inhibition is not a headline record; Addendum A2-7: logged, excluded from every count |
| - 44 | is_derivative = y (semisynthetic / synthetic analogue) | 59 | 44 | 1754 | Decision Q3: derivatives are recorded with is_derivative = y and excluded from headline counts |
| - 0 | is_derivative EMPTY ruled 'unclear' (PMID 19818567, row 1349): kept in scope, not an exclusion; PENDING ADJUDICATION | 1 | 0 | 1754 | Project-lead ruling 2026-10-19 (`rulings.csv` R001). No Decisions clause covers an empty value; Q3 excludes only is_derivative = y. The frozen workbook cell stays empty |
| - 21 | virus_host = plant, bacteriophage or other (TMV, TSWV) | 36 | 21 | 1733 | Decision Q6: plant, insect and phage virus assays are kept, tagged by virus_host, and excluded from headline counts (host from the project dictionary; no phage, insect or other-host record occurs) |
| - 0 | endpoint is not IC50, EC50, IC90, EC90 or ED50 | 46 | 0 | 1733 | Addendum A1: numeric potency counts only IC50, EC50, IC90, EC90, ED50 (CC50-type values never enter an endpoint, A2-1) |
| - 2 | confirmed duplicate record (identical apart from notes, PMID 17890069 rows 1302 and 1303) | 2 | 2 | 1731 | Guideline section 2: replicates and the same number reported in several places are one record (row 1299 kept) |

**Final line: 1,731 records remain = headline scope (`auto_headline_scope` = y), including 1 record pending adjudication (ruling R001).** Check: 1,988 - 257 excluded = 1,731.

## By evidence tier

| step | exclusion | full_text (new / remaining) | abstract (new / remaining) | unclear (new / remaining) | all (new / remaining) |
|---|---|---|---|---|---|
| start | records | 1043 | 908 | 37 | 1988 |
| reference | role = reference (positive controls and reference drugs) | -120 / 923 | -22 / 886 | -2 / 35 | -144 / 1844 |
| pct | value_status = pct_inhibition (single-concentration % inhibition) | -26 / 897 | -20 / 866 | -0 / 35 | -46 / 1798 |
| deriv | is_derivative = y (semisynthetic / synthetic analogue) | -29 / 868 | -15 / 851 | -0 / 35 | -44 / 1754 |
| ruling R001 | is_derivative EMPTY ruled 'unclear' (PMID 19818567, row 1349): kept in scope, not an exclusion; PENDING ADJUDICATION | -0 / 868 | -0 / 851 | -0 / 35 | -0 / 1754 |
| host | virus_host = plant, bacteriophage or other (TMV, TSWV) | -10 / 858 | -11 / 840 | -0 / 35 | -21 / 1733 |
| endpoint | endpoint is not IC50, EC50, IC90, EC90 or ED50 | -0 / 858 | -0 / 840 | -0 / 35 | -0 / 1733 |
| dup | confirmed duplicate record (identical apart from notes, PMID 17890069 rows 1302 and 1303) | -0 / 858 | -2 / 838 | -0 / 35 | -2 / 1731 |

Final line per tier: full_text 858; abstract 838; unclear 35; all 1,731.

## Not exclusions (kept in scope, for completeness)

- Decision Q5: surrogate systems (replicon, pseudovirus, enzyme-only) are included with `assay_type`; 266 headline records are replicon, pseudovirus or enzyme assays and 15 have no assay_type.
- Decision Q7: converted units count toward N (converted = y does not exclude).
- Rows with `value_status` = figure_only (Q4): 0 in the workbook, so no exclusion line is needed.
- Records of papers that are retracted (section 8.2): 0 (none).
- The origin ruling (47 rows in `origin_to_adjudicate.csv`) moves records between the evidence tiers but not out of scope.

## Pending adjudication

`is_derivative` is empty for one record (PMID 19818567, row 1349). Ruling R001 (2026-10-19) records it as `unclear`, keeps it in scope and so makes the headline scope 1,731 (it was 1,730 while the enrichment rule excluded it). **Pending adjudication:** if it is ruled y it leaves the scope (1,730), if n it stays (1,731). The frozen workbook cell is unchanged; the ruling lives in `rulings.csv` and, in derived form, in `enriched_records.csv` (column `auto_is_derivative_ruled`).