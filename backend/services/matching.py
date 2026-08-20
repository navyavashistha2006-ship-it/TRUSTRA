from services.normalization import clean_text

def match_location(loc1: str, loc2: str) -> bool:
    """Checks if two locations match (case-insensitive and sanitized)."""
    return clean_text(loc1) == clean_text(loc2)

def match_service(svc1: str, svc2: str) -> bool:
    """Checks if two services match (case-insensitive)."""
    return clean_text(svc1) == clean_text(svc2)

def match_route(route1: str, route2: str) -> bool:
    """
    Robust route matching helper. Matches direct equality, substrings,
    and direction reversals (e.g. 'Airport to Hotel' matches 'Hotel to Airport').
    """
    norm1 = clean_text(route1)
    norm2 = clean_text(route2)
    
    if not norm1 or not norm2:
        return False
        
    if norm1 == norm2:
        return True
        
    if norm1 in norm2 or norm2 in norm1:
        return True
        
    # Standard route direction separators
    separators = ['to', '➔', '->', '-']
    for sep in separators:
        if sep in norm1 and sep in norm2:
            parts1 = [p.strip() for p in norm1.split(sep) if p.strip()]
            parts2 = [p.strip() for p in norm2.split(sep) if p.strip()]
            if len(parts1) == 2 and len(parts2) == 2:
                # Direct match
                if parts1[0] == parts2[0] and parts1[1] == parts2[1]:
                    return True
                # Reversed direction match
                if parts1[0] == parts2[1] and parts1[1] == parts2[0]:
                    return True
                    
    return False
