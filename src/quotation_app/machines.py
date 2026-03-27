"""
Machine rates for quotation calculations.
Extracted from React component kalkulator_wycen.jsx
"""

RATES = {
    # Druk (Printing)
    'atma': 170,      # Atma printer
    'insignia': 210,  # Insignia printer
    'aquity': 130,    # Aquity printer
    'tampo': 80,      # Tampo printer
    'roland': 65,     # Roland
    
    # Intro (Finishing)
    'lam': 35,        # Laminator
    'gilotyna': 55,   # Guillotine
    'kaszerka': 55,   # Kaszerka
    'sztanc': 55,     # Sztanc
    
    # Drewno (Woodworking)
    'bhx': 95,        # BHX center
    'homag': 85,      # Homag center
    'brandt': 100,    # Brandt edger
    'holzma': 100,    # Holzma saw
    'wielowrzec': 70, # Multi-spindle
    
    # Plottery (Plotters)
    'ploter_a4004': 50,  # A4004 plotter
    'laser_nrg': 50,     # NRG laser
    
    # Termo (Thermoforming)
    'termo_s': 40,    # Small thermoformer
    'termo_l': 90,    # Large thermoformer
    'termo_r': 50,    # Roll thermoformer
    'prasa_hyd': 55,  # Hydraulic press
    
    # Inne (Others)
    'festool': 35,      # Festool
    'laser_metal': 50,  # Metal laser
}
# Default rate for manual operations
DEFAULT_RATE = 60
