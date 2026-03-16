#!/usr/bin/env python3
import csv, io, json, re, urllib.request

SHEET_ID = "1NrxpQFCx-lGjIs5AnJ6i0T7jlMcXVBbQyu9s175q2Kg"
# User confirmed all current applications now live on Applied tab.
GIDS = {
    "Applied": "528672075",
}


def fetch_rows(gid):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}"
    text = urllib.request.urlopen(url, timeout=20).read().decode("utf-8", "ignore")
    return list(csv.reader(io.StringIO(text)))


def parse_pay_mid(text):
    if not text:
        return None
    nums = [float(x.replace(",", "")) for x in re.findall(r"\d+[\d,]*", str(text))]
    if len(nums) >= 2:
        return (nums[0] + nums[1]) / 2
    if len(nums) == 1:
        return nums[0]
    return None


def normalize_header(raw):
    header = [c.strip() for c in raw[0]]

    # If there are duplicate/empty columns, keep stable index mapping as fallback.
    def idx_or(name, fallback_idx):
        for i, c in enumerate(header):
            if c.lower() == name.lower():
                return i
        return fallback_idx

    mapping = {
        "company": idx_or("Company", 0),
        "location": idx_or("Location", 2),
        "stage": idx_or("Stage", 3),
        "made_it_to": idx_or("Made it to", 4),
        "role": idx_or("Position", 6),
        "appl_date": idx_or("Appl Date", 7),
        "salary_range": idx_or("Salary Range", 8),
        "notes": 10,
    }
    return mapping


def parse_rows(sheet_name, raw):
    if not raw:
        return []
    m = normalize_header(raw)
    out = []
    for r in raw[1:]:
        if not any(str(x).strip() for x in r):
            continue
        get = lambda i: (r[i].strip() if i < len(r) else "")
        company = get(m["company"])
        role = get(m["role"])
        if not company and not role:
            continue
        stage = get(m["stage"])
        made_it_to = get(m["made_it_to"])
        out.append(
            {
                "sheet": sheet_name,
                "company": company,
                "role": role,
                "status": stage.lower(),
                "stage": stage,
                "madeItTo": made_it_to,
                "location": get(m["location"]),
                "applDate": get(m["appl_date"]),
                "salaryRange": get(m["salary_range"]),
                "payMid": parse_pay_mid(get(m["salary_range"])),
                "url": "",
                "notes": get(m["notes"]),
            }
        )
    return out


def main():
    entries = []
    for name, gid in GIDS.items():
        entries.extend(parse_rows(name, fetch_rows(gid)))

    out_path = "/home/openclaw/.openclaw/workspace/webdash/data/jobs.json"
    with open(out_path, "w") as f:
        json.dump({"entries": entries}, f, indent=2)
    print(f"Wrote {len(entries)} entries to {out_path}")


if __name__ == "__main__":
    main()
