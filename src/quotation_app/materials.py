"""
Material database for quotations.
Parses material data from Excel price list.
"""

import pandas as pd
from pathlib import Path

class MaterialDatabase:
    """Material price and supplier database."""
    
    def __init__(self, data_file):
        """
        Initialize material database from Excel file.
        
        Args:
            data_file: Path to "Nowy_Cennik_Zakupy_...CM.xlsx"
        """
        self.data_file = Path(data_file)
        self.materials = []
        self.load_data()
    
    def load_data(self):
        """Load and parse Excel material list."""
        if not self.data_file.exists():
            raise FileNotFoundError(f"Material file not found: {self.data_file}")
        
        # Read from row 7 (skipping header rows)
        df = pd.read_excel(self.data_file, header=6)
        
        # Expected columns based on analysis
        expected_columns = [
            'Kupiec', 'Indeks', 'Nazwa', 'Nazwa dodatkowa',
            'Jednostka miary', 'Alternatywna jednostka miary',
            'Przelicznik', 'CENA NETTO + BUFOR + OPEX 2026'
        ]
        
        self.materials = df.to_dict('records')
        print(f"Loaded {len(self.materials)} materials from {self.data_file.name}")
    
    def search(self, name_query):
        """
        Search materials by name.
        
        Args:
            name_query: Partial name to search for
            
        Returns:
            List of matching materials
        """
        name_lower = name_query.lower()
        matches = []
        for material in self.materials:
            if (name_lower in str(material.get('Nazwa', '')).lower() or 
                name_lower in str(material.get('Indeks', '')).lower()):
                matches.append(material)
        return matches
    
    def get_by_index(self, index):
        """Find material by exact index."""
        for material in self.materials:
            if material.get('Indeks') == index:
                return material
        return None
