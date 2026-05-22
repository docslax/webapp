#!/usr/bin/env python3
"""
export_preorders.py

Usage:
  python3 export_preorders.py /path/to/forms/preorder/data.json /output/path/preorders-export.csv

Produces CSV columns:
<blank>, etransferName, parentName, childInfo, phone, email,
poinsettia, centrepiece, wreath, candyCane, butterChicken, butterChickpea
"""

import sys
import json
import csv
from pathlib import Path

FIELDS = [
    "",  # blank column
    "etransferName",
    "parentName",
    "childInfo",
    "phone",
    "email",
    "poinsettia",
    "centrepiece",
    "wreath",
    "candyCane",
    "butterChicken",
    "butterChickpea",
    "paymentReceived",
]

def load_data(json_path: Path):
    if not json_path.exists():
        raise FileNotFoundError(f"data file not found: {json_path}")
    return json.loads(json_path.read_text(encoding="utf-8"))

def normalize_value(v):
    # ensure numeric fields are numbers (or 0) and strings are safe
    if v is None:
        return ""
    if isinstance(v, (int, float)):
        return v
    return str(v)

def row_for_csv(row):
    # produce values in order of FIELDS; blank column becomes ''
    out = []
    for f in FIELDS:
        if f == "":
            out.append("")  # blank column
        else:
            out.append(normalize_value(row.get(f, "")))
    return out

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 export_preorders.py /path/to/data.json /path/to/output.csv")
        sys.exit(2)

    data_file = Path(sys.argv[1])
    out_file = Path(sys.argv[2])

    data = load_data(data_file)
    if not isinstance(data, list):
        print("Expected JSON array in data.json")
        sys.exit(3)

    # Write CSV
    with out_file.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        # header - first column intentionally blank
        writer.writerow(FIELDS)
        for row in data:
            writer.writerow(row_for_csv(row))

    print(f"Wrote {len(data)} rows to {out_file}")

if __name__ == "__main__":
    main()
