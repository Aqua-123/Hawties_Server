import csv

ROWS = 100000
COLS = 500
OUTPUT_FILE = "blank_spreadsheet.csv"


def generate_blank_csv(rows, cols, output_file):
    print(f"Generating {rows} x {cols} blank CSV file...")

    with open(output_file, mode="w", newline="") as file:
        writer = csv.writer(file)

        # Generate header (first row of empty strings)
        header = [""] * cols
        writer.writerow(header)

        # Generate all rows
        row = [""] * cols
        for _ in range(rows):
            writer.writerow(row)

    print(f"Blank CSV file generated: {output_file}")


if __name__ == "__main__":
    generate_blank_csv(ROWS, COLS, OUTPUT_FILE)
