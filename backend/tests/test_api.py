"""API tests against the real release v0.1 database. Run from backend/: python -m pytest -q
Needs requirements-dev.txt. Skipped when the database file is not present (set AVPCD_DB_PATH)."""
import os
import re
import sqlite3
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.config import DEFAULT_DB_PATH, Settings  # noqa: E402

DB = Path(os.environ.get("AVPCD_DB_PATH") or DEFAULT_DB_PATH)
pytestmark = pytest.mark.skipif(not DB.is_file(), reason="release database not found")
CONTRACT = Path(__file__).resolve().parents[2] / "DATA_CONTRACT.md"


def make_client(**overrides):
    from fastapi.testclient import TestClient
    from app.main import create_app
    base = Settings.from_env()
    settings = Settings(**{**base.__dict__, "db_path": DB, **overrides})
    return TestClient(create_app(settings))


@pytest.fixture(scope="module")
def client():
    return make_client(enable_download=True, cors_origins=("https://avpcd.example.org",))


@pytest.fixture(scope="module")
def truth():
    con = sqlite3.connect(f"{DB.resolve().as_uri()}?mode=ro", uri=True)
    yield con
    con.close()


def test_health_and_stats(client, truth):
    assert client.get("/api/health").json()["status"] == "ok"
    s = client.get("/api/stats").json()
    assert s["records"] == truth.execute("SELECT COUNT(*) FROM records").fetchone()[0] == 1731
    assert sum(s["by_evidence_tier"].values()) == s["records"]
    assert s["by_evidence_tier"] == {"full_text": 858, "abstract": 838, "unclear": 35}
    assert set(s["meta"]) == {"version", "date", "licence"} and "CC BY 4.0" in s["meta"]["licence"]  # no internal metadata is exposed
    assert sum(s["by_endpoint"].values()) == s["records"]


def test_list_columns_and_pagination(client):
    from app.queries import SUMMARY_COLUMNS
    r = client.get("/api/records", params={"page_size": 10, "page": 2}).json()
    assert r["total"] == 1731 and r["page"] == 2 and r["page_size"] == 10 and r["pages"] == 174
    assert len(r["results"]) == 10 and list(r["results"][0]) == SUMMARY_COLUMNS
    ids = [x["record_id"] for x in r["results"]]
    assert ids == sorted(ids)
    assert client.get("/api/records", params={"page_size": 100000}).json()["page_size"] == 200  # capped
    assert client.get("/api/records", params={"page": 10 ** 6}).json()["results"] == []


def test_filters_match_sql(client, truth):
    def n(sql, *p):
        return truth.execute(sql, p).fetchone()[0]

    def total(**params):
        return client.get("/api/records", params=params).json()["total"]

    assert total(compound="lycorine") == n("SELECT COUNT(*) FROM records WHERE compound_name LIKE '%lycorine%'")
    assert total(endpoint="IC50") == 1104 and total(endpoint="IC50,EC50") == 1704
    assert total(endpoint=["IC90", "EC90"]) == 25
    assert total(tier="unclear") == 35 and total(tier="abstract,unclear") == 873
    assert total(flag="none") == 1386 and total(flag="value_to_check") == n(
        "SELECT COUNT(*) FROM records WHERE ';'||data_quality_flags||';' LIKE '%;value_to_check;%'")
    lo, hi = 10, 1000
    assert total(value_min=lo, value_max=hi) == n(
        "SELECT COUNT(*) FROM records WHERE value_nM<>'' AND CAST(value_nM AS REAL) BETWEEN ? AND ?", lo, hi)
    key = truth.execute("SELECT inchikey FROM records WHERE inchikey<>'' LIMIT 1").fetchone()[0]
    assert total(inchikey=key) == n("SELECT COUNT(*) FROM records WHERE inchikey=?", key)
    assert total(inchikey=key[:14]) == n("SELECT COUNT(*) FROM records WHERE inchikey LIKE ?", key[:14] + "-%")
    assert total(plant="Lycoris") >= 1 and total(virus="HIV") >= 1
    assert total(endpoint="IC50", tier="full_text") <= min(total(endpoint="IC50"), total(tier="full_text"))


def test_wildcards_are_literal(client):
    assert client.get("/api/records", params={"compound": "%"}).json()["total"] == 0
    assert client.get("/api/records", params={"compound": "_"}).json()["total"] < 1731
    assert client.get("/api/records", params={"compound": "'; DROP TABLE records; --"}).json()["total"] == 0
    assert client.get("/api/stats").json()["records"] == 1731


def test_sorting(client):
    up = client.get("/api/records", params={"sort": "value_nM", "order": "asc", "page_size": 200}).json()["results"]
    vals = [float(x["value_nM"]) for x in up if x["value_nM"] != ""]
    assert vals == sorted(vals)
    last = client.get("/api/records", params={"sort": "value_nM", "order": "desc", "page_size": 200, "page": 9}).json()["results"]
    assert last[-1]["value_nM"] == ""  # empty values last in both directions
    assert client.get("/api/records", params={"sort": "notes"}).status_code == 422


@pytest.mark.parametrize("params", [
    {"endpoint": "IC51"}, {"tier": "x"}, {"flag": "x"}, {"inchikey": "abc"}, {"value_min": -1},
    {"value_min": 5, "value_max": 1}, {"page": 0}, {"order": "up"}, {"compound": "x" * 101}])
def test_bad_input_is_422(client, params):
    assert client.get("/api/records", params=params).status_code == 422


def test_record_detail_has_every_release_column(client, truth):
    cols = [r[1] for r in truth.execute("PRAGMA table_info(records)")]
    pcols = [r[1] for r in truth.execute("PRAGMA table_info(papers)")]
    r = client.get("/api/record/R0002").json()
    assert list(r) == ["record", "paper"] and list(r["record"]) == cols and list(r["paper"]) == pcols
    assert r["record"]["pmid"] == r["paper"]["pmid"]
    assert not any("curator" in c for c in cols), "curator identifiers must not be in the release"
    assert client.get("/api/record/R9999").status_code == 404
    assert client.get("/api/record/x").status_code == 422


def test_download_gate_and_content(client, truth):
    r = client.get("/api/download")
    assert "records" in r.json()["tables"]
    r = client.get("/api/download", params={"table": "waterfall"})
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    assert r.content.startswith(b"\xef\xbb\xbf")
    assert len(r.text.strip().splitlines()) == 1 + truth.execute("SELECT COUNT(*) FROM waterfall").fetchone()[0]
    assert client.get("/api/download", params={"table": "sqlite_master"}).status_code == 404
    off = make_client()  # default: downloads disabled
    assert off.get("/api/download", params={"table": "records"}).status_code == 403


def test_facets_and_dictionary(client, truth):
    for kind, total in (("virus", 1731), ("plant", 1731), ("endpoint", 1731), ("compound", 1179)):
        j = client.get(f"/api/facets/{kind}").json()
        assert j["kind"] == kind and sum(i["records"] for i in j["items"]) == total
        counts = [i["records"] for i in j["items"]]
        assert counts == sorted(counts, reverse=True)
    comp = client.get("/api/facets/compound").json()["items"]
    assert len(comp) == truth.execute("SELECT COUNT(DISTINCT inchikey) FROM records WHERE inchikey<>''").fetchone()[0]
    assert set(comp[0]) == {"inchikey", "compound_name", "records"}
    assert client.get("/api/facets/class").status_code == 404
    d = client.get("/api/dictionary").json()["rows"]
    assert len(d) == truth.execute("SELECT COUNT(*) FROM data_dictionary").fetchone()[0] == 105
    assert list(d[0]) == ["table", "column", "kind", "description", "source"]
    fam = client.get("/api/records", params={"virus": "Retroviridae"}).json()["total"]
    assert fam == truth.execute("SELECT COUNT(*) FROM records WHERE ictv_family='Retroviridae'").fetchone()[0]


def test_cors(client):
    ok = client.get("/api/stats", headers={"Origin": "https://avpcd.example.org"})
    assert ok.headers.get("access-control-allow-origin") == "https://avpcd.example.org"
    bad = client.get("/api/stats", headers={"Origin": "https://evil.example.org"})
    assert "access-control-allow-origin" not in bad.headers
    none = make_client(cors_origins=())
    assert "access-control-allow-origin" not in none.get("/api/stats", headers={"Origin": "https://avpcd.example.org"}).headers


def test_database_is_read_only():
    from app.db import Release
    con = Release(DB).connect()
    with pytest.raises(sqlite3.OperationalError):
        con.execute("DELETE FROM records")
    con.close()


def test_data_contract_lists_exactly_the_columns(truth):
    from app.queries import SUMMARY_COLUMNS
    text = CONTRACT.read_text(encoding="utf-8")
    rec_cols = [r[1] for r in truth.execute("PRAGMA table_info(records)")]
    paper_cols = [r[1] for r in truth.execute("PRAGMA table_info(papers)")]
    section = lambda name: text.split(f"## {name}")[1].split("\n#")[0]  # noqa: E731
    documented = lambda sec: re.findall(r"^\| `([A-Za-z0-9_]+)` \|", sec, re.M)  # noqa: E731
    assert documented(section("Record (all columns)")) == rec_cols
    assert documented(section("Paper object")) == paper_cols
    assert documented(section("List item")) == SUMMARY_COLUMNS
