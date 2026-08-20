import os
import argparse
import pandas as pd
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser(description="TRUSTRA Local Reference Data Management CLI")
    
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Sub-command: list
    list_parser = subparsers.add_parser("list", help="List summary statistics of local datasets.")

    # Sub-command: add-price
    add_price_parser = subparsers.add_parser("add-price", help="Add a new price benchmark observation.")
    add_price_parser.add_argument("--source", required=True, help="Data source name (e.g. ixigo)")
    add_price_parser.add_argument("--url", default="", help="Optional source URL verification link")
    add_price_parser.add_argument("--location", required=True, help="City destination")
    add_price_parser.add_argument("--service", required=True, help="Service type (e.g. Taxi)")
    add_price_parser.add_argument("--route", required=True, help="Specific route context")
    add_price_parser.add_argument("--category", default="Standard", help="Vehicle or service tier")
    add_price_parser.add_argument("--price", type=float, required=True, help="Numerical price amount")
    add_price_parser.add_argument("--currency", default="INR", help="Currency symbol")

    # Sub-command: refresh-dates
    refresh_parser = subparsers.add_parser("refresh-dates", help="Bump all collected dates to today to simulate freshness.")

    return parser.parse_args()

def get_paths():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, 'data')
    return {
        "price_references": os.path.join(data_dir, 'price_references.csv'),
        "complaints": os.path.join(data_dir, 'complaints.csv'),
        "incidents": os.path.join(data_dir, 'incidents.csv')
    }

def handle_list(paths):
    print("=== TRUSTRA Data Summary ===")
    for name, path in paths.items():
        if os.path.exists(path):
            df = pd.read_csv(path)
            print(f"- {name:16}: {len(df):4} records found. (File: {os.path.basename(path)})")
        else:
            print(f"- {name:16}: NOT FOUND.")

def handle_add_price(args, paths):
    path = paths["price_references"]
    
    new_row = {
        "source_name": args.source,
        "source_url": args.url,
        "collected_at": datetime.now().strftime("%Y-%m-%d"),
        "location": args.location,
        "service_type": args.service,
        "route_context": args.route,
        "vehicle_or_service_category": args.category,
        "price": args.price,
        "currency": args.currency,
        "included_distance": "Not specified",
        "extra_charge_details": "None",
        "booking_date_context": "current reference",
        "data_type": "public_reference"
    }

    if os.path.exists(path):
        df = pd.read_csv(path)
        # Avoid exact duplicate appends
        duplicate = df[
            (df['source_name'] == args.source) &
            (df['location'] == args.location) &
            (df['service_type'] == args.service) &
            (df['route_context'] == args.route) &
            (df['price'] == args.price)
        ]
        if not duplicate.empty:
            print(f"Skipping: Price record already exists in database.")
            return

        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    else:
        df = pd.DataFrame([new_row])

    df.to_csv(path, index=False)
    print(f"Success: Added price benchmark {args.currency}{args.price:.0f} for {args.location} {args.service} ({args.route}).")

def handle_refresh_dates(paths):
    path = paths["price_references"]
    if not os.path.exists(path):
        print("Error: No price references found to refresh.")
        return

    df = pd.read_csv(path)
    df['collected_at'] = datetime.now().strftime("%Y-%m-%d")
    df.to_csv(path, index=False)
    print(f"Success: Updated {len(df)} price reference entries to today's date ({datetime.now().strftime('%Y-%m-%d')}).")

def main():
    args = parse_args()
    paths = get_paths()

    if args.command == "list":
        handle_list(paths)
    elif args.command == "add-price":
        handle_add_price(args, paths)
    elif args.command == "refresh-dates":
        handle_refresh_dates(paths)

if __name__ == "__main__":
    main()
