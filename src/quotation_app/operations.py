"""
Operation definitions for quotation calculations.
Translated from React component kalkulator_wycen.jsx
"""

from .machines import RATES
import math

class Operation:
    """Base class for all operations."""
    
    def __init__(self, machine=None):
        self.machine = machine
        self.params = {}
        self.op_c = 0.0  # Operation cost
        self.set_c = 0.0  # Setup cost
        self.op_h = 0.0  # Operation time (hours)
        self.set_h = 0.0  # Setup time (hours)
    
    @property
    def total_cost(self):
        return self.op_c + self.set_c
    
    @property
    def total_time(self):
        return self.op_h + self.set_h

class DrukSitowy(Operation):
    """
    Druk Sitowy (Screen Printing) operation.
    Based on JSX calculation logic.
    """
    
    def __init__(self, machine='atma', **params):
        super().__init__(machine)
        self.operation_name = "Druk Sitowy"
        self.category = "Druk"
        self.color = "#3b82f6"
        
        # Default parameters
        default_params = {
            'dl': 1500,  # Dług. formatki [mm] - sheet length
            'sz': 1000,  # Szer. formatki [mm] - sheet width
            'uz': 1,     # Użytków/formatce - pieces per sheet
            'ko': 5,     # Ilość kolorów - number of colors
            'pr': 5,     # Ilość przelotów - number of passes
            'farba': 'srebrna'  # Farba - paint type
        }
        
        # Merge provided params with defaults
        self.params = {**default_params, **params}
    
    def calculate(self, naklad):
        """
        Calculate costs for screen printing operation.
        
        Args:
            naklad: Production quantity (number of pieces)
            
        Returns:
            dict with op_c, set_c, op_h, set_h
        """
        # Get machine rate
        rate = RATES.get(self.machine, 170)
        
        # Number of sheets needed
        sheets = math.ceil(naklad / max(1, self.params.get('uz', 1)))
        
        # Sheet area in m²
        area = (self.params.get('dl', 1500) * self.params.get('sz', 1000)) / 1_000_000
        
        # Operation time per sheet (hours)
        # Formula from JSX: sheets * (p.ko || 1) * (p.pr || 1) * ((p.dl || 1500) / 4000 / 60 + 13 / 3600)
        opp_h_per_sheet = ((self.params.get('dl', 1500) / 4000 / 60) + (13 / 3600))
        self.op_h = sheets * (self.params.get('ko', 1)) * (self.params.get('pr', 1)) * opp_h_per_sheet
        
        # Setup time
        # Formula from JSX: (p.ko || 1) * (59 + 10 / 60) / 60
        self.set_h = (self.params.get('ko', 1) * (59 + 10 / 60)) / 60
        
        # Paint consumption cost per sheet
        # Formula from JSX: sheets * area * (p.ko || 1) * (p.farba === "srebrna" ? 1.2 : 0.68)
        paint_cost_per_sheet = area * (self.params.get('ko', 1))
        if self.params.get('farba') == 'srebrna':
            paint_cost = sheets * paint_cost_per_sheet * 1.2
        else:
            paint_cost = sheets * paint_cost_per_sheet * 0.68
        
        # Screen preparation cost
        # Formula from JSX: (p.ko || 1) * 250
        screen_cost = (self.params.get('ko', 1)) * 250
        
        # Calculate costs
        self.op_c = (self.op_h * rate) + paint_cost
        self.set_c = (self.set_h * rate) + screen_cost
        
        return {
            'op_c': self.op_c,
            'set_c': self.set_c,
            'op_h': self.op_h,
            'set_h': self.set_h
        }

# Factory function to create operations by type
def create_operation(op_type, **params):
    """Create operation by type identifier."""
    operations = {
        'druk_sito': DrukSitowy,
        # More operations to be added: druk_uv, druk_tampo, laminowanie, etc.
    }
    
    if op_type not in operations:
        raise ValueError(f"Unknown operation type: {op_type}")
    
    return operations[op_type](**params)
