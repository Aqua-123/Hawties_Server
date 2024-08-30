#!/bin/bash
ROWS=10000
COLS=10000
OUTPUT_FILE="blank_spreadsheet.csv"

# Create a blank CSV file
echo "Generating $ROWS x $COLS blank CSV file..."

# Generate header
HEADER=$(yes "," | head -n $COLS | tr -d '\n')
echo $HEADER > $OUTPUT_FILE

# Generate rows
for i in $(seq 1 $ROWS); do
    ROW=$(yes "," | head -n $COLS | tr -d '\n')
    echo $ROW >> $OUTPUT_FILE
done

echo "Blank CSV file generated: $OUTPUT_FILE"
