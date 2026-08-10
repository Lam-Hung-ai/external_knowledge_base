import re
import sys
from pathlib import Path


def clean_schema(sql: str) -> str:
    # 1. Remove psql meta commands: \restrict, \unrestrict, \connect...
    sql = re.sub(r"(?m)^\\.*$\n?", "", sql)

    # 2. Remove comments do pg_dump sinh ra
    sql = re.sub(r"(?m)^--.*$\n?", "", sql)

    # 3. Remove SET ...
    sql = re.sub(
        r"(?ims)^SET\s+.*?;\s*",
        "",
        sql,
    )

    # 4. Remove SELECT pg_catalog.set_config(...)
    sql = re.sub(
        r"(?ims)^SELECT\s+pg_catalog\.set_config\(.*?;\s*",
        "",
        sql,
    )

    # 5. Remove CREATE SCHEMA public
    # sqlc doesn't need if object already used public.xxx
    sql = re.sub(
        r"(?ims)^CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?public\s*;\s*",
        "",
        sql,
    )

    # 6. Remove ownership
    sql = re.sub(
        r"(?ims)^ALTER\s+(?:TABLE|SCHEMA|SEQUENCE|VIEW|FUNCTION|TYPE)"
        r".*?\s+OWNER\s+TO\s+.*?;\s*",
        "",
        sql,
    )

    # 7. Remove GRANT / REVOKE
    sql = re.sub(
        r"(?ims)^(?:GRANT|REVOKE)\s+.*?;\s*",
        "",
        sql,
    )

    # 8. Remove COMMENT ON ...
    sql = re.sub(
        r"(?ims)^COMMENT\s+ON\s+.*?;\s*",
        "",
        sql,
    )

    # 9. Cleanup multiple newlines
    sql = re.sub(r"\n{3,}", "\n\n", sql)

    # Remove qualifier public.
    sql = re.sub(r"\bpublic\.", "", sql)

    return sql.strip() + "\n"


def main():
    if len(sys.argv) != 3:
        print(
            "Usage: clean_schema.py <input.sql> <output.sql>",
            file=sys.stderr,
        )
        sys.exit(1)

    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])

    sql = input_file.read_text(encoding="utf-8")
    cleaned = clean_schema(sql)

    output_file.write_text(cleaned, encoding="utf-8")

    print(f"Cleaned schema written to {output_file}")


if __name__ == "__main__":
    main()
