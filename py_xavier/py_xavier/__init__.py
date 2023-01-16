# -*- coding: utf-8 -*-
"""Py Xavier

@Author: Antonio Cantudo <antoniocantudo@correo.ugr.es>
@Date: 01/10/2023
@Links: https://github.com/granasat/xavier

Copyright (C) 2023 GranaSAT <granasat@ugr.es>

Todo:
    * Examples

"""

import re
import requests
from typing import List, Union

from .custom_types import StdpType, PulseTrain


def build_url(*args):
    return re.sub(r"([^:]/)(/)+", r"\1", '/'.join(args))

def snake_to_camelcase_str(mon_str: str):
    split_str = mon_str.split('_')
    return split_str[0] + ''.join([el.title() for el in (split_str[1:] if len(split_str) > 1 else '')])

def convert_snake_to_camelcase_dict(mon_dict: dict):
    camelcase_dict = {}

    for key, value in mon_dict.items():
        if type(value) is dict:
            camelcase_dict[snake_to_camelcase_str(key)] = convert_snake_to_camelcase_dict(value)
        else:
            camelcase_dict[snake_to_camelcase_str(key)] = value
            if type(value) is list:
                for idx, el in enumerate(value):
                    if type(el) is dict:
                        value[idx] = convert_snake_to_camelcase_dict(el)

    return camelcase_dict


class Xavier():
    """Exceptions are documented in the same way as classes.

    Main class, every interaction with the backend is done via this object.

    Args:
        host (str): IP address of Xavier host machine (where the B1530) module is connected.
        port (int): TCP port of Xavier , where the backend is running.

    Attributes:
        msg (str): IP address of xavier host.
        port (int): TCP port of Xavier .

    """

    PROTO_PREFIX = 'http://'
    API_PREFIX = 'api'

    ENDPOINT_PING = 'ping'
    ENDPOINT_CALIBRATE = 'calibrate'

    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.measure = Measure(self)

    def calibrate(self) -> None:
        """
            Calls the WGFMU autocalibration function.
        """
        requests.post(
            build_url(self._baseurl, self.ENDPOINT_CALIBRATE),
            timeout=2
        )

    def api_isalive(self) -> bool:
        """
            Pings the API

            Returns:
                boolean: True if the API is up, False if it is down.
        """

        try:
            response = requests.get(
                build_url(self._baseurl, self.ENDPOINT_PING),
                timeout=2
            )
            return True

        except Exception as _:
            print(_)
            return False

    @property
    def _baseurl(self):
        """
            Returns the base HTTP url where to make the requests
        """

        return build_url(
            self.PROTO_PREFIX, self.host + ':' + str(self.port), self.API_PREFIX
        )


class Measure():
    """
        Measurement class for its use inside Xavier.

        Args:
            xavier (Xavier): Xavier instance to bind to

        Attributes:
            xavier (Xavier): Binded Xavier instance.
    """

    API_PREFIX = 'measurements'

    ENDPOINT_PULSE = 'pulse'
    ENDPOINT_PULSE_COLLECTION = 'pulse-collection'
    ENDPOINT_STDP = 'stdp'
    ENDPOINT_STDP_COLLECTION = 'stdp-collection'
    ENDPOINT_RETRIEVE_MEASUREMENT = ''

    def __init__(self, xavier: Xavier):
        self.xavier = xavier

    def pulse(
            self, v_high: float, v_low: float, cycle_time: float,
            duty_cycle: float, n_pulses: int, n_points_high: int,
            n_points_low: int, avg_time: float, noise: bool, noise_std:
            float = 0.0) -> Union[int, None]:
        """
            Performs a pulsed measurement

            Args:
                v_high (float): One of the two alternating voltages that define
                    the pulses. Unit: Volts.
                v_low (float): The other voltage that defines the pulses.
                cycle_time (float): Duration of a cycle. Unit Volts.
                duty_cycle (float): Percent of the cycle dedicated to v_high.
                n_pulses (int): Number of pulses to repeat.
                n_points_high (int): Number of points retrieved during the
                    high interval of the pulses.
                n_points_low (int): Number of points retrieved during the low
                    interval of the pulses.
                avg_time (int): Averaging time of the samples. Refer to the 
                    B1530 user guide for more information.
                    https://l4.granasat.space/docs/B1500A/wgfmu/programming_guide
                noise (bool): Wheter or not to add noise to the signal, 
                    useful for stochastic resonance measurements. White 
                    Gaussian noise that is.
                noise_std (float): STD of the white Gaussian noise to add to the
                    generated waveform. Optional.

            Notes:
                _____     _____     _____ ------------> v_high
                |   |     |   |     |   |
                |   |     |   |     |   |
                |   |_____|   |_____|   |_____ -------> v_low

                |<------->| cycle_time


            Returns:
                Union[int, None]: If return type is an int, a new measurement
                ID has been created in the database and the B1530A should be
                currently measuring, in this case the API has to be polled for
                new updates on the measurement. If the return type is None,
                database insertion has failed.
        """

        req_params = {
            "vHigh": v_high,
            "vLow": v_low,
            "cycleTime": cycle_time,
            "dutyCycle": duty_cycle,
            "nPulses": n_pulses,
            "nPointsHigh": n_points_high,
            "nPointsLow": n_points_low,
            "avgTime": avg_time,
            "noise": noise,
            "noiseStd": noise_std
        }


        response = requests.post(
            build_url(
                self.xavier._baseurl, self.API_PREFIX, self.ENDPOINT_PULSE),
            json=req_params)

        return response.json()

    def pulse_collection(
            self, pulse_train_collection: List[PulseTrain], n_points_high: int,
            n_points_low: int, avg_time: float, noise: bool, noise_std:
            float = 0.0) -> Union[int, None]:
        """
            Performs a pulsed measurement

            Args:
                v_high (float): One of the two alternating voltages that define
                    the pulses. Unit: Volts.
                v_low (float): The other voltage that defines the pulses.
                cycle_time (float): Duration of a cycle. Unit Volts.
                duty_cycle (float): Percent of the cycle dedicated to v_high.
                n_pulses (int): Number of pulses to repeat.
                n_points_high (int): Number of points retrieved during the
                    high interval of the pulses.
                n_points_low (int): Number of points retrieved during the low
                    interval of the pulses.
                avg_time (int): Averaging time of the samples. Refer to the 
                    B1530 user guide for more information.
                    https://l4.granasat.space/docs/B1500A/wgfmu/programming_guide
                noise (bool): Wheter or not to add noise to the signal, 
                    useful for stochastic resonance measurements. White 
                    Gaussian noise that is.
                noise_std (float): STD of the white Gaussian noise to add to the
                    generated waveform. Optional.

            Returns:
                Union[int, None]: If return type is an int, a new measurement
                ID has been created in the database and the B1530A should be
                currently measuring, in this case the API has to be polled for
                new updates on the measurement. If the return type is None,
                database insertion has failed.
        """

        req_params = {
            "pulseTrainCollection": pulse_train_collection,
            "nPointsHigh": n_points_high,
            "nPointsLow": n_points_low,
            "avgTime": avg_time,
            "noise": noise,
            "noiseStd": noise_std
        }

        req_params = convert_snake_to_camelcase_dict(req_params)

        response = requests.post(
            build_url(
                self.xavier._baseurl, self.API_PREFIX, self.ENDPOINT_PULSE_COLLECTION),
            json=req_params)
        print(response._content)
        return response.json()

    def stdp(self, amplitude: float, delay: float, wait_time: float,
             pulse_duration: float, n_points: int, avg_time: float, noise: bool,
             noise_std: float = 0.0) -> Union[int, None]:
        """
            Performs a single STDP measurement

            Args:k
                amplitude (float): STDP forming pulses (green and orange in the
                    Xavier gui) peak-to-peak voltage. Unit: Volts.
                    delay (float): How much time to wait before and after
                    including the STDP pulses.


            Returns:
                Union[int, None]: If return type is an int, a new measurement
                ID has been created in the database and the B1530A should be
                currently measuring, in this case the API has to be polled for
                new updates on the measurement. If the return type is None,
                database insertion has failed.
        """

        req_params = {
            "amplitude": amplitude,
            "delay": delay,
            "waitTime": wait_time,
            "pulseDuration": pulse_duration,
            "nPoints": n_points,
            "avgTime": avg_time,
            "noise": noise,
            "noiseStd": noise_std
        }

        response = requests.post(
            build_url(
                self.xavier._baseurl, self.API_PREFIX, self.ENDPOINT_STDP
            )
        )

        return response.json()

    def stdp_collection(
            self, amplitude: float, delay_points: int, wait_time: float,
            pulse_duration: float, stdp_type: StdpType, n_points: int,
            avg_time: float, noise: bool, noise_std: float = 0.0):
        """
            Performs a collection of STDP measurement, cahracterizing the
            potenciation / depression curves.

            Returns:
                Union[int, None]: If return type is an int, a new measurement
                ID has been created in the database and the B1530A should be
                currently measuring, in this case the API has to be polled for
                new updates on the measurement. If the return type is None,
                database insertion has failed.
        """

        req_params = {
            "amplitude": amplitude,
            "delayPoints": delay_points,
            "waitTime": wait_time,
            "pulseDuration": pulse_duration,
            "stdpType": stdp_type,
            "nPoints": n_points,
            "avgTime": avg_time,
            "noise": noise,
            "noiseStd": noise_std
        }

        response = requests.post(
            build_url(
                self.xavier._baseurl, self.API_PREFIX,
                self.ENDPOINT_STDP_COLLECTION))

        return response.json()

    def retrieve_measurement(self, meas_id: int):
        """
            Retrieves a measurement from the remote database in JSON format.

            Args:
                meas_id (int): Database ID of the desired measurement to 
                retrieve.
        """

        response = requests.get(
            build_url(
                self.xavier._baseurl, self.API_PREFIX,
                self.ENDPOINT_RETRIEVE_MEASUREMENT, str(meas_id)
            )
        )

        return response.json()
