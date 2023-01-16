from typing import Literal, TypedDict

StdpType = Literal[ 'Depression', 'Potenciation' ]

class PulseTrain(TypedDict): 
    n_pulses: int
    duty_cycle: float
    cycle_time: float
    v_high: float
    v_low: float
