import re

def clean_text(text: str) -> str:
    """Sanitizes text by lowercasing and stripping special characters/excess spaces."""
    if not text:
        return ""
    # Lowercase and convert all whitespace sequences to single space
    cleaned = text.lower().strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # Remove non-alphanumeric characters except standard separators
    cleaned = re.sub(r'[^a-z0-9\s\-\➔\-\>to]', '', cleaned)
    return cleaned.strip()
