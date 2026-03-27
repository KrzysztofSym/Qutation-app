# VALIDATION GUIDE - How to Verify Calculations

This guide shows how to validate Python calculations against Excel source data.

---

## 🔍 **STEP 1: Run Python Tests**

Get Python calculation results:

```bash
cd "/home/falcon/Work/Quote app"
source venv/bin/activate
python src/test_first_operation.py > validation_output.txt
cat validation_output.txt
```

**Expected output (for 100 pieces):**
```
Operation time: 24.653 hours (1479.2 min)
Setup time: 4.931 hours (295.8 min)
Operation cost: 5090.97 PLN
Setup cost: 2088.19 PLN
Total: 7179.17 PLN
```

**Copy these values for comparison.**

---

## 🔍 **STEP 2: Find in Excel**

Navigate to the Excel file:

```bash
cd "/home/falcon/Work/Quote app/data"
# Open in LibreOffice or Excel:
libreoffice "KALKULATOR- WYCEN.xlsx" &
```

### Where to Look:

**Sheet:** `KALKULATOR` (first sheet)

**Find the operation block for "Druk Sitowy":**
- Look for column headers: "OPERACJA", "NAKŁAD", "CZAS", etc.
- Row 4 typically has: "OPERACJA NAKŁAD PRZEZBROJENIE NAKŁAD CZAS NA 1 SZTUKĘ"
- Row 5 should show parameters matching test script.

**Parameters to find (row 5):**
- `Poz. 5`: **dłuższa krawędź [mm]** → 1500
- `Poz. 6`: **krótsza krawędź [mm]** → 1000
- `Poz. 7`: **Użytków/formatce** → 1
- `Poz. 8`: **Ilość kolorów** → 5
- `Poz. 9`: **Ilość przelotów** → 5
- `Poz. 10`: **RODZAJ FARBY** → srebrna

**Expected Excel Output Location:**

Look for these **column headers** (might be row 4-6):

- **"Czas operacji"** or **"Czas [h]"** → Should be ~24.65 hours
- **"Czas przezbrojenia"** or **"Przezbr. [h]"** → Should be ~4.93 hours
- **"KOSZT"** → Should be around 7179 PLN
- **"Maszyna"** column → Should show "Atma (170/h)"

⚠️ **Excel Layout Note:**
The file has complex formatting with merged cells. The actual calculation values may start around **row 15+** after parameter rows. Look for the number **100** in a column (naklad) and follow across to find costs and times.

---

## 🔍 **STEP 3: Compare Values**

Create a comparison table:

| Metric | Python | Excel | Difference | Status |
|--------|--------|-------|------------|--------|
| Operation time (100 pcs) | 24.653 h | [Excel val] | X.XXX h | ⏳ |
| Setup time (100 pcs) | 4.931 h | [Excel val] | X.XXX h | ⏳ |
| Total cost (100 pcs) | 7179.17 PLN | [Excel val] | X.XX PLN | ⏳ |

**Do this for all three quantities (100, 500, 1000 pieces).**

---

## ✅ **STEP 4: Acceptable Tolerance**

**What's considered "correct":**

- **Time:** ±0.01 hours (36 seconds) or ±1 minute
- **Cost:** ±0.1 PLN (10 groszy) or ±0.5%
- **Setup time:** Should be identical (doesn't scale with quantity)

**If differences are larger:**
- Check if using correct: machine rate, paint multiplier, color count
- Verify Excel formulas match Python logic
- Check rounding differences (Excel vs Python `round()` )

---

## 📊 **EXPECTED EXCEL VALUES**

Based on JSX source code analysis, expected values for Druk Sitowy operation:

### **Machine:** Atma (rate = 170 PLN/hour)

For **100 pieces**:
- **Sheets needed:** 100 ÷ 1 = 100 sheets
- **Operation time:** ~24.65 hours
- **Setup time:** ~4.93 hours (constant)
- **Paint cost:** ~1,200 PLN (silver paint)
- **Screen prep:** 1,250 PLN (5 colors × 250)
- **Total cost:** ~7,179 PLN

For **1000 pieces**:
- **Sheets needed:** 1000 ÷ 1 = 1000 sheets
- **Operation time:** ~246.53 hours (scales linearly)
- **Setup time:** ~4.93 hours (unchanged)
- **Total cost:** ~52,998 PLN
- **Cost per piece:** ~53.00 PLN (cheaper per unit due to amortized setup)

---

## 🔧 **AUTOMATED VALIDATION**

Compare Python vs Excel programmatically:

```python
# Create script: src/validate_excel.py
cd "src" && cat > validate_excel.py << 'EOF'
"""
Validation: Compare Python vs Excel outputs
"""

import pandas as pd
from pathlib import Path
from quotation_app.operations import DrukSitowy

# Load Excel
data_file = Path("../data/KALKULATOR- WYCEN.xlsx")
df = pd.read_excel(data_file, sheet_name="KALKULATOR", header=5)

# Find Druk Sitowy calculation (row where operation = "Druk Sitowy")
for idx, row in df.iterrows():
    operation = str(row.get('OPERACJA', '')).lower()
    if "druk sito" in operation:
        print(f"\nFound row {idx}:")
        print(f"  Excel - Operation time: {row.get('Czas operacji', 'N/A')}")
        print(f"  Excel - Setup time: {row.get('Czas przezbrojenia', 'N/A')}")
        print(f"  Excel - Total cost: {row.get('Koszt', 'N/A')}")
        break

# Compare with Python
test_op = DrukSitowy(machine='atma')
test_op.calculate(100)  # for 100 pieces

print("\nPython - Operation time:", test_op.op_h)
print("Python - Setup time:", test_op.set_h)
print("Python - Total cost:", test_op.total_cost)
EOF
```

```bash
source venv/bin/activate
python src/validate_excel.py
```

---

## 🎯 **VALIDATION CHECKLIST**

- [ ] Run Python test → Get output values
- [ ] Open Excel → Find Druk Sitowy section
- [ ] Verify parameters match: 1500×1000, 5 colors, 5 passes, silver paint
- [ ] Check machine = "Atma"
- [ ] Compare operation time (100 pcs): approx 24.65 hours
- [ ] Compare setup time: approx 4.93 hours
- [ ] Compare total cost (100 pcs): approx 7179 PLN
- [ ] Repeat for 500 and 1000 pcs
- [ ] Differences < 1% = ✓ PASS

**All boxes checked? → Validation complete!**

---

## 📚 **TROUBLESHOOTING**

### Can't find value in Excel?
- Columns may be merged - look carefully
- Try searching (Ctrl+F) for: "druk", "atma", or numeric values (24.65)
- Check that Excel formulas are calculation mode (not showing errors)

### Python values don't match?
1. **Check rounding** - Python may show more decimals than Excel
2. **Verify parameters** - Ensure TEST_PARAMS match Excel row exactly
3. **Check rate** - Confirm using 'atma' (170 PLN/h) in both
4. **Paint calculation** - Silver (srebrna) uses 1.2 multiplier, other paints use 0.68
5. **Sheet count** - Confirm `uz=1` means 1 piece per sheet

### Need help debugging?
Add debug prints to operations.py:
```python
# In DrukSitowy.calculate():
print(f"DEBUG: sheets={sheets}, area={area}, colors={self.params.get('ko')}")
print(f"DEBUG: op_h={self.op_h}, set_h={self.set_h}, paint_cost={paint_cost}")
```

---

## 🎓 **LEARNING OUTCOME**

After validation, you will have:
- ✓ Confidence that Python code matches Excel calculations
- ✓ Understanding of formula translation accuracy
- ✓ Knowledge of tolerance expectations
- ✓ Foundation for translating 74 remaining operations
- ✓ Real validation skill (important for Data Analyst role)

**Takeaway:** If DrukSitowy validates correctly, the pattern works for all operations!

---

## 🚀 **READY TO VALIDATE?**

**Option 1 (Manual):** Follow this guide, hand-compare values
**Option 2 (Semi-auto):** Create validate_excel.py script
**Option 3 (AI-assisted):** Tell me values from Excel, I'll compare

**Start with:** Just validate the **100-piece** calculation to build confidence.

---

**Questions during validation? I'm here to help!** ✓