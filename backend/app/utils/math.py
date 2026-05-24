def clamp(value: float, minimum: float, maximum: float) -> float:
    return min(max(value, minimum), maximum)


def round_value(value: float, places: int = 1) -> float:
    return round(value, places)
