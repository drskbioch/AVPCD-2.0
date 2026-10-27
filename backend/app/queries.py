"""SQL for the list endpoint. Every user value is a bound parameter; column names and sort keys come from fixed lists."""
import re
from dataclasses import dataclass, field

# Columns of `records` returned by /api/records (all other columns are in /api/record/{id}). Release column names, unchanged.
SUMMARY_COLUMNS = [
    "record_id", "pmid", "compound_name", "inchikey", "plant_species", "virus_verbatim", "ictv_species",
    "assay_type", "cell_line", "endpoint", "relation", "value_raw", "unit_raw", "value_nM",
    "evidence_tier", "novelty_status", "data_quality_flags",
]

# sort key -> ORDER BY expression (value_nM is TEXT in the release, so it is cast)
SORT_KEYS = {
    "record_id": "record_id",
    "pmid": "CAST(pmid AS INTEGER)",
    "compound_name": "compound_name COLLATE NOCASE",
    "endpoint": "endpoint",
    "evidence_tier": "evidence_tier",
    "value_nM": "CAST(NULLIF(value_nM, '') AS REAL)",
}


def order_clause(sort: str, direction: str) -> str:
    """ORDER BY text for a validated sort key; direction is 'ASC' or 'DESC'. Empty value_nM sorts last in both directions."""
    expr = SORT_KEYS[sort]
    lead = "(value_nM IS NULL OR value_nM = ''), " if sort == "value_nM" else ""
    return f"{lead}{expr} {direction}, record_id ASC"


INCHIKEY_RE = re.compile(r"^[A-Z]{14}(-[A-Z]{10}-[A-Z])?$")  # full key or the 14-character connectivity block
RECORD_ID_RE = re.compile(r"^R\d{4}$")


@dataclass
class RecordFilters:
    compound: str | None = None
    inchikey: str | None = None
    plant: str | None = None
    virus: str | None = None
    endpoint: list = field(default_factory=list)
    value_min: float | None = None
    value_max: float | None = None
    tier: list = field(default_factory=list)
    flag: list = field(default_factory=list)


def _like(text: str) -> str:
    return "%" + text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def build_where(f: RecordFilters):
    """Returns (where_sql, params). Filters combine with AND; values inside one multi-value filter combine with OR."""
    clauses, params = [], []
    if f.compound:
        clauses.append("compound_name LIKE ? ESCAPE '\\'")
        params.append(_like(f.compound))
    if f.inchikey:
        if len(f.inchikey) == 14:
            clauses.append("inchikey LIKE ?")
            params.append(f.inchikey + "-%")
        else:
            clauses.append("inchikey = ?")
            params.append(f.inchikey)
    if f.plant:
        clauses.append("(plant_species LIKE ? ESCAPE '\\' OR plant_family LIKE ? ESCAPE '\\')")
        params += [_like(f.plant)] * 2
    if f.virus:
        clauses.append("(virus_verbatim LIKE ? ESCAPE '\\' OR ictv_species LIKE ? ESCAPE '\\' OR ictv_family LIKE ? ESCAPE '\\')")
        params += [_like(f.virus)] * 3
    if f.endpoint:
        clauses.append(f"endpoint IN ({','.join('?' * len(f.endpoint))})")
        params += f.endpoint
    if f.tier:
        clauses.append(f"evidence_tier IN ({','.join('?' * len(f.tier))})")
        params += f.tier
    if f.value_min is not None or f.value_max is not None:
        clauses.append("value_nM <> ''")  # a range filter leaves out records with no molar value
        if f.value_min is not None:
            clauses.append("CAST(value_nM AS REAL) >= ?")
            params.append(f.value_min)
        if f.value_max is not None:
            clauses.append("CAST(value_nM AS REAL) <= ?")
            params.append(f.value_max)
    if f.flag:
        parts = []
        for token in f.flag:
            if token == "none":
                parts.append("data_quality_flags = ''")
            else:
                parts.append("(';' || data_quality_flags || ';') LIKE ?")
                params.append(f"%;{token};%")
        clauses.append("(" + " OR ".join(parts) + ")")
    return (" WHERE " + " AND ".join(clauses)) if clauses else "", params
