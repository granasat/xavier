from typing import Literal, TypedDict

StdpType = Literal[ 'Depression', 'Potenciation' ]

class PulseTrain(TypedDict): 
    # The number of pulses the train has
    n_pulses: int
    # The duty cycle of the pulses, that is the proportion of the cycle time
    # that the pulse is active (at v_high).
    duty_cycle: float
    # The cycle time, that is the time that it takes to complete a cycle, 
    # one v_high, one v_low. (seconds)
    cycle_time: float
    # Active voltage of the pulses, see notes above. (Volts)
    v_high: float
    # Low voltage of the pulses, see notes above. (Volts)
    v_low: float
    # Initial waiting delay, in seconds. (seconds)
    delay: float