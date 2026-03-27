# Quotation Tool

Python-based quotation calculator for beauty product merchandising and manufacturing.

## Project Overview

This project aims to rebuild the existing React/Excel quotation calculator in Python to improve automation, flexibility, and integration capabilities.

**Target Use Case:** Small companies generating product quotations efficiently, focusing on wall units for beauty products, shelving systems, and merchandising solutions.

## Source Files Structure

```
Quote app/
├── data/
│   ├── KALKULATOR- WYCEN.xlsx (2.6MB) - Main calculation spreadsheet
│   └── Nowy_Cennik_Zakupy_03_2026_bazowy_—_CM.xlsx - Material price list
├── src/
│   ├── kalkulator_wycen.jsx - React component (738 lines)
│   ├── analyze_sources.py - Python analysis script
│   └── quotation_app/ - Python package (to be implemented)
├── tests/ - Test suite (to be implemented)
└── requirements.txt - Python dependencies
```

## Tech Stack

- **Python 3.x** (learning in progress via freeCodeCamp)
- **pandas** - Data manipulation and analysis
- **openpyxl** - Excel file processing
- **pytest** - Testing framework (recommended)

## Getting Started

### 1. Set Up Python Environment

```bash
cd "/home/falcon/Work/Quote app"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run Source Analysis

```bash
source venv/bin/activate
python src/analyze_sources.py
```

This will show you the structure of all source files (JSX, Excel files) to understand the calculation logic.

### 3. Explore the Source

The JSX file contains:

- **OP_DEFS**: Array of operation definitions with calculation formulas
- **RATES**: Machine hourly rates (PLN/hour)
- **15+ operation types**: Druk, intro, drewno, termo, frez, formy, metal

The Excel files contain:

- **KALKULATOR sheet**: Master calculation with 203 rows × 19 columns
- **Material prices**: 443 rows of supplier data with prices, MOQ, lead times

## Implementation Roadmap

### Phase 1: Core Calculator (80% of effort)

- [ ] Design calculator.py interface
- [ ] Implement operations.py module (translate JSX OP_DEFS)
- [ ] Add machine rates configuration
- [ ] Build calculation engine
- [ ] Validate against Excel outputs

### Phase 2: Material Integration (20% of effort)

- [ ] Parse material price list into database
- [ ] Link materials to operations
- [ ] Create searchable material catalog

### Phase 3: CLI Interface

- [ ] Command-line interface for calculations
- [ ] JSON input/output format
- [ ] Export results to Excel/CSV
- [ ] Batch processing capabilities

## Learning Opportunities

This project aligns with your Data Analyst career goals:

- **Python skills**: Real-world data transformation, file I/O, business logic
- **Data analysis**: Cost modeling, production optimization, material pricing
- **Testing**: Unit tests, validation, data integrity checks
- **Tools**: pandas for data manipulation, Excel integration

## Key Formulas

Each operation calculates:

- `opC`: Operation cost (operating time × machine rate)
- `setC`: Setup cost (setup time × machine rate)
- `opH`: Operation time in hours
- `setH`: Setup time in hours

Complex factors include:

- Sheet formats (B0+, B0, B1, B2, B3, B4)
- Machine speeds and cycle times
- Material consumption
- Multiple color passes
- Cutting distances

## Contributing Guidelines

Remember your working constraints:

1. **Sessions:** 1-2 hours, evenings only
2. **Focus:** Ask if stuck >20 minutes
3. **Break tasks into <1 hour chunks**
4. **Define next step before stopping**
5. **No zero days**
6. **Welcome direct criticism** - use it as data to improve

## Next Steps

For your next 1-hour session:

1. **Run the analysis script** to see source structure
2. **Review JSX operations** - start with `Druk Sitowy` (screen printing)
3. **Identify 2-3 small functions** to extract first
4. **Ask for help if needed** - better to progress than get stuck

## GitHub Repository Setup

**I have not created a GitHub repo yet** - as you requested to do this via browser.

### When ready to push to GitHub

**Via GitHub.com in browser:**

1. Go to github.com and log in
2. Click "+" (top right) → "New repository"
3. Enter: `quotation-app` (or `QuotationApp`)
4. Select: Private (since this is work-related)
5. Click "Create repository"
6. **Important:** DO NOT check "Initialize repository with README" (you already have one locally)
7. After creation, copy the "push an existing repository" commands:

   ```bash
   cd "/home/falcon/Work/Quote app"
   git remote add origin https://github.com/YOUR-USERNAME/quotation-app.git
   git branch -M main
   git push -u origin main
   ```

Or use SSH if you have it set up:

   ```bash
   git remote add origin git@github.com:YOUR-USERNAME/quotation-app.git
   git branch -M main
   git push -u origin main
   ```

### Before pushing, consider

- Are there any sensitive work files in the data/ directory?
- The Excel files contain business data - should they be private?
- Consider adding `data/*.xlsx` to `.gitignore` if data is sensitive

Let me know when you're ready and I can help with the git commands!
