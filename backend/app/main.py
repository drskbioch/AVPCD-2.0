"""AVPCD API: read-only JSON over release v0.1 (SQLite). Run: uvicorn app.main:app  (see ../README.md)."""
import csv
import io
import math
from contextlib import closing

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse

from .config import Settings
from .db import Release
from .queries import INCHIKEY_RE, RECORD_ID_RE, SORT_KEYS, SUMMARY_COLUMNS, RecordFilters, build_where, order_clause

TEXT_MAX = 100


def _multi(values, allowed, label):
    """Accepts repeated (?tier=a&tier=b) and comma-separated (?tier=a,b) values; refuses unknown ones."""
    out = []
    for v in values or []:
        out += [p.strip() for p in v.split(",") if p.strip()]
    bad = [v for v in out if v not in allowed]
    if bad:
        raise HTTPException(422, f"unknown {label} {bad}; allowed: {sorted(allowed)}")
    return out


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    release = Release(settings.db_path)
    app = FastAPI(
        title="AVPCD API",
        version=release.meta.get("version", "unknown"),
        description="Read-only API over AVPCD release " + release.meta.get("version", "?") + ".",
        docs_url="/docs" if settings.enable_docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.enable_docs else None,
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    if settings.cors_origins:
        app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), allow_methods=["GET"],
                           allow_headers=[], allow_credentials=False, max_age=600)

    def db():
        con = release.connect()
        try:
            yield con
        finally:
            con.close()

    @app.middleware("http")
    async def headers(request: Request, call_next):
        resp = await call_next(request)
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        if request.url.path.startswith("/api/") and request.url.path != "/api/health":
            resp.headers.setdefault("Cache-Control", "public, max-age=300")  # the database file is immutable
        return resp

    @app.get("/api/health")
    def health():
        return {"status": "ok", "release_version": release.meta.get("version"), "records": release.meta.get("records")}

    @app.get("/api/records")
    def records(
        con=Depends(db),
        compound: str | None = Query(None, max_length=TEXT_MAX, description="substring of compound_name"),
        inchikey: str | None = Query(None, max_length=27, description="full InChIKey or its 14-character first block"),
        plant: str | None = Query(None, max_length=TEXT_MAX, description="substring of plant_species or plant_family"),
        virus: str | None = Query(None, max_length=TEXT_MAX, description="substring of virus_verbatim, ictv_species or ictv_family"),
        endpoint: list[str] | None = Query(None, description="IC50, EC50, ...; repeat or comma-separate"),
        value_min: float | None = Query(None, ge=0, description="lower bound of value_nM (nM)"),
        value_max: float | None = Query(None, ge=0, description="upper bound of value_nM (nM)"),
        tier: list[str] | None = Query(None, description="evidence_tier: full_text, abstract, unclear"),
        flag: list[str] | None = Query(None, description="a data_quality_flags name, or 'none'"),
        page: int = Query(1, ge=1),
        page_size: int | None = Query(None, ge=1),
        sort: str = Query("record_id"),
        order: str = Query("asc", pattern="^(asc|desc)$"),
    ):
        if sort not in SORT_KEYS:
            raise HTTPException(422, f"unknown sort {sort!r}; allowed: {sorted(SORT_KEYS)}")
        if inchikey is not None:
            inchikey = inchikey.strip().upper()
            if not INCHIKEY_RE.match(inchikey):
                raise HTTPException(422, "inchikey must be a full InChIKey (27 characters) or its first 14 characters")
        if value_min is not None and value_max is not None and value_min > value_max:
            raise HTTPException(422, "value_min is greater than value_max")
        size = min(page_size or settings.default_page_size, settings.max_page_size)
        f = RecordFilters(
            compound=(compound or "").strip() or None, inchikey=inchikey,
            plant=(plant or "").strip() or None, virus=(virus or "").strip() or None,
            endpoint=_multi(endpoint, release.endpoints, "endpoint"),
            value_min=value_min, value_max=value_max,
            tier=_multi(tier, release.tiers, "tier"),
            flag=_multi(flag, release.flags | {"none"}, "flag"),
        )
        where, params = build_where(f)
        total = con.execute(f"SELECT COUNT(*) FROM records{where}", params).fetchone()[0]
        sql = (f"SELECT {', '.join(SUMMARY_COLUMNS)} FROM records{where} "
               f"ORDER BY {order_clause(sort, 'DESC' if order == 'desc' else 'ASC')} LIMIT ? OFFSET ?")
        rows = con.execute(sql, params + [size, (page - 1) * size]).fetchall()
        return {"total": total, "page": page, "page_size": size, "pages": math.ceil(total / size),
                "results": [dict(r) for r in rows]}

    @app.get("/api/record/{record_id}")
    def record(record_id: str, con=Depends(db)):
        if not RECORD_ID_RE.match(record_id):
            raise HTTPException(422, "record_id looks like R0002")
        row = con.execute("SELECT * FROM records WHERE record_id = ?", (record_id,)).fetchone()
        if row is None:
            raise HTTPException(404, f"no record {record_id}")
        paper = con.execute("SELECT * FROM papers WHERE pmid = ?", (row["pmid"],)).fetchone()
        return {"record": dict(row), "paper": dict(paper) if paper else None}

    stats_cache: dict = {}

    @app.get("/api/stats")
    def stats(con=Depends(db)):
        key = release.mtime
        if stats_cache.get("key") != key:
            def grouped(col):
                return {(r[0] or ""): r[1] for r in con.execute(
                    f"SELECT {col}, COUNT(*) FROM records GROUP BY 1 ORDER BY 2 DESC, 1")}
            flag_counts = {"none": con.execute("SELECT COUNT(*) FROM records WHERE data_quality_flags = ''").fetchone()[0]}
            for token in sorted(release.flags):
                flag_counts[token] = con.execute("SELECT COUNT(*) FROM records WHERE (';' || data_quality_flags || ';') LIKE ?",
                                                 (f"%;{token};%",)).fetchone()[0]
            def q(sql):
                return con.execute(sql).fetchone()[0]

            stats_cache.update(key=key, value={
                "meta": {k: release.meta[k] for k in ("version", "date", "licence") if k in release.meta},
                "records": q("SELECT COUNT(*) FROM records"),
                "papers": q("SELECT COUNT(*) FROM papers"),
                "compounds": q("SELECT COUNT(*) FROM compounds") if "compounds" in release.tables else None,
                "records_with_structure": q("SELECT COUNT(*) FROM records WHERE inchikey <> ''"),
                "by_evidence_tier": grouped("evidence_tier"),
                "by_endpoint": grouped("endpoint"),
                "by_assay_type": grouped("assay_type"),
                "by_virus_host": grouped("virus_host"),
                "by_novelty_status": grouped("novelty_status"),
                "by_data_quality_flag": flag_counts,
            })
        return stats_cache["value"]

    facet_cache: dict = {}

    @app.get("/api/facets/{kind}")
    def facets(kind: str, con=Depends(db)):
        """Counts of records per virus (family, species), plant (family, species), compound (InChIKey) or endpoint, for the browse pages."""
        if kind not in ("virus", "plant", "compound", "endpoint"):
            raise HTTPException(404, "kind is one of: virus, plant, compound, endpoint")
        if facet_cache.get("key") != release.mtime:
            facet_cache.clear()
            facet_cache["key"] = release.mtime
        if kind not in facet_cache:
            if kind == "virus":
                rows = con.execute("SELECT ictv_family, ictv_species, COUNT(*) AS records FROM records GROUP BY 1, 2 ORDER BY 3 DESC, 1, 2")
                items = [dict(r) for r in rows]
            elif kind == "plant":
                rows = con.execute("SELECT plant_family, plant_species, COUNT(*) AS records FROM records GROUP BY 1, 2 ORDER BY 3 DESC, 1, 2")
                items = [dict(r) for r in rows]
            elif kind == "endpoint":
                rows = con.execute("SELECT endpoint, COUNT(*) AS records FROM records GROUP BY 1 ORDER BY 2 DESC, 1")
                items = [dict(r) for r in rows]
            else:  # compound: one item per InChIKey, named by its most frequent compound_name (ties: alphabetical)
                names: dict = {}
                for r in con.execute("SELECT inchikey, compound_name, COUNT(*) FROM records WHERE inchikey <> '' GROUP BY 1, 2"):
                    names.setdefault(r[0], []).append((r[1], r[2]))
                items = [{"inchikey": k, "compound_name": sorted(v, key=lambda t: (-t[1], t[0]))[0][0], "records": sum(n for _, n in v)}
                         for k, v in names.items()]
                items.sort(key=lambda i: (-i["records"], i["compound_name"].lower(), i["inchikey"]))
            facet_cache[kind] = {"kind": kind, "items": items}
        return facet_cache[kind]

    @app.get("/api/download")
    def download(table: str | None = Query(None), con=Depends(db)):
        """CSV of one release table (UTF-8 with BOM, like the release files). Disabled unless AVPCD_ENABLE_DOWNLOAD=true."""
        if not settings.enable_download:
            raise HTTPException(403, "downloads are disabled on this server (not offered by this server)")
        if table is None:
            return {"tables": release.tables, "format": "csv", "usage": "/api/download?table=records"}
        if table not in release.tables:  # whitelist: the table name is interpolated below
            raise HTTPException(404, f"no table {table!r}; available: {release.tables}")
        cols = release.columns[table]

        def rows():
            buf = io.StringIO(newline="")
            w = csv.writer(buf)
            w.writerow(cols)
            yield "﻿" + buf.getvalue()
            with closing(release.connect()) as c2:  # own connection: the request-scoped one closes before streaming ends
                cur = c2.execute(f'SELECT * FROM "{table}"')
                while chunk := cur.fetchmany(500):
                    buf = io.StringIO(newline="")
                    csv.writer(buf).writerows([tuple(r) for r in chunk])
                    yield buf.getvalue()

        name = f"avpcd_{release.meta.get('version', 'release')}_{table}.csv"
        return StreamingResponse(rows(), media_type="text/csv; charset=utf-8",
                                 headers={"Content-Disposition": f'attachment; filename="{name}"'})

    return app


app = create_app()
