#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import revpimodio2
import time
import threading

active_time = 0
activ_state = True
reques_time = 0
action_time = 0

stopThread = False

def handleStatusLEDs(the_revpi):
    global active_time
    global action_time
    global activ_state
    global reques_time
    global stopThread
    while True:
        time.sleep(0.1)
        now = time.monotonic()
        override_a1 = False

        if reques_time > 0.0:
            override_a1 = True
            elp_requst = now - reques_time
            if elp_requst >= 0.2:
                reques_time = 0
                override_a1 = False

        elp_active = now - active_time
        if elp_active >= 1.0:
            active_time = now
            activ_state = not activ_state

        if override_a1 == False:
            the_revpi.core.a1red.value = False
            the_revpi.core.a1green.value = activ_state

        elp_action = now - action_time
        if elp_action > 0.2:
            the_revpi.core.A2 = revpimodio2.OFF
            action_time = 0

        if stopThread:
            break;
    the_revpi.core.a1green.value = False



class RevPiModDO():

    def __init__(self):
        self.ledThred = None
        self.revpi = revpimodio2.RevPiModIO(autorefresh=True)
        self.revpi.core.A1 = revpimodio2.GREEN
        # Handle SIGINT / SIGTERM to exit program cleanly
        self.revpi.handlesignalend(self.cleanup_revpi)
        # Register events to all Inputs

        #self.revpi.io.I_1.reg_event(self.event_input_changed, edge=revpimodio2.BOTH)

        for device in self.revpi.device:
            # Use only DIO, DI, DO, AIO Devices
            if device.type == "LEFT_RIGHT":
                for io in device.get_inputs():
                    io.reg_event(self.event_input_changed)


    def cleanup_revpi(self):
        global stopThread

        stopThread = True
        # Switch of LED and outputs before exit program
        self.revpi.core.a1green.value = False



    def event_input_changed(self, ioname, iovalue):
        global action_time;
        action_time = time.monotonic()
        self.revpi.core.A2 = revpimodio2.RED
        if iovalue == True:
            print(ioname + "#ON")
            sys.stdout.flush()
        else:
            print(ioname + "#OFF")
            sys.stdout.flush()


    def get(self, output_name):
        global reques_time;
        reques_time = time.monotonic()
        self.revpi.core.A1 = revpimodio2.RED
        if self.revpi.io[output_name].value == True:
            print(output_name + "#ON")
            sys.stdout.flush()
        else:
            print(output_name + "#OFF")
            sys.stdout.flush()


    def set(self, output_name, value):
        global action_time;
        action_time = time.monotonic()
        self.revpi.core.A2 = revpimodio2.GREEN
        self.revpi.io[output_name].value = value


    def setOn(self, output_name):
        self.set(output_name, True)


    def setOff(self, output_name):
        self.set(output_name, False)


    def getTEMP(self):
        global reques_time;
        reques_time = time.monotonic()
        self.revpi.core.A1 = revpimodio2.RED
        tempVal = self.revpi.core.temperature
        tempStr = str(tempVal)
        print("TEMP#"+tempStr)
        sys.stdout.flush()


    def start(self):

        self.revpi.mainloop(blocking=False)
        self.ledThred = threading.Thread(target=handleStatusLEDs, args=(self.revpi,))
        self.ledThred.start()

        while not self.revpi.exitsignal.wait(0.1):
            for line in sys.stdin:
                ltxt = line.strip()
                cmds = ltxt.split("#")
                if len(cmds) > 1:
                    outn = cmds[0]
                    cmdp = cmds[1]
                    if cmdp == "ON":
                        self.setOn(outn)
                        self.get(outn)
                    elif cmdp == "OFF":
                        self.setOff(outn)
                        self.get(outn)
                    elif cmdp == "GET":
                        self.get(outn)
                    elif cmdp == "TEMP":
                        self.getTEMP()


if __name__ == "__main__":
    root = RevPiModDO()
    root.start()
