"""
Main quotation calculator engine.
Coordinates operations and materials to generate quotes.
"""

from .operations import Operation
from .materials import MaterialDatabase
from .machines import RATES, DEFAULT_RATE

class QuotationCalculator:
    """Main calculator for generating product quotations."""
    
    def __init__(self, material_db=None):
        """
        Initialize calculator.
        
        Args:
            material_db: Path to material Excel file or MaterialDatabase instance
        """
        self.material_db = None
        if material_db:
            if isinstance(material_db, MaterialDatabase):
                self.material_db = material_db
            else:
                self.material_db = MaterialDatabase(material_db)
        
        self.operations = []
        self.job_info = {}
        self.margin = 20.0  # Default margin %
    
    def add_operation(self, operation):
        """Add an operation to the quote."""
        self.operations.append(operation)
    
    def set_naklad(self, naklad):
        """Set production quantity (naklad)."""
        self.job_info['naklad'] = naklad
        # Recalculate all operations with new quantity
        for op in self.operations:
            op.calculate(naklad)
    
    def calculate(self):
        """
        Calculate total quote.
        
        Returns:
            dict with breakdown: operations, materials, subtotal, margin, total
        """
        if 'naklad' not in self.job_info:
            raise ValueError("Naklad (quantity) must be set before calculating")
        
        # Calculate operations
        op_total = sum(op.total_cost for op in self.operations)
        op_time = sum(op.total_time for op in self.operations)
        
        # Materials (placeholder - to be implemented)
        mat_total = 0.0
        
        # Subtotal
        subtotal = op_total + mat_total
        
        # Margin
        margin_amt = subtotal * self.margin / 100
        total_net = subtotal + margin_amt
        
        return {
            'operations_cost': op_total,
            'materials_cost': mat_total,
            'subtotal': subtotal,
            'margin_percent': self.margin,
            'margin_amount': margin_amt,
            'total_net': total_net,
            'total_time_hours': op_time,
            'operation_breakdown': self.operations
        }
