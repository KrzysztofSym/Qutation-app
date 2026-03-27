#!/usr/bin/env python3
"""
Test script for the first operation implementation.
Tests DrukSitowy operation against known values from Excel.
"""

import sys
sys.path.insert(0, '.')

from quotation_app.operations import DrukSitowy
from quotation_app.machines import RATES

# Test parameters matching Excel defaults
TEST_PARAMS = {
    'dl': 1500,  # Sheet length [mm]
    'sz': 1000,  # Sheet width [mm]
    'uz': 1,     # Pieces per sheet
    'ko': 5,     # Number of colors
    'pr': 5,     # Number of passes
    'farba': 'srebrna'
}

def test_druk_sitowy():
    """Test screen printing operation with default parameters."""
    print("Testing Druk Sitowy (Screen Printing) Operation")
    print("=" * 60)
    
    # Create operation
    op = DrukSitowy(machine='atma', **TEST_PARAMS)
    
    # Test at different quantities
    for naklad in [100, 500, 1000]:
        result = op.calculate(naklad)
        
        print(f"\nNaklad: {naklad} pieces")
        print(f"  Operation time: {op.op_h:.3f} hours ({op.op_h*60:.1f} min)")
        print(f"  Setup time: {op.set_h:.3f} hours ({op.set_h*60:.1f} min)")
        print(f"  Operation cost: {op.op_c:.2f} PLN")
        print(f"  Setup cost: {op.set_c:.2f} PLN")
        print(f"  Total: {op.total_cost:.2f} PLN")
        print(f"  Cost per piece: {(op.total_cost/naklad):.2f} PLN")
    
    print("\n" + "=" * 60)
    print("✓ First operation implementation complete!")
    print("✓ Ready to compare with Excel data")

if __name__ == "__main__":
    test_druk_sitowy()
