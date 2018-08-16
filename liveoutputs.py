#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import revpimodio2
from time import sleep

class RevPiModDO():

    def __init__(self):
        self.revpi = revpimodio2.RevPiModIO(autorefresh=True)

    def get(self, output_name):
        if self.revpi.io[output_name].value == True:
            print(output_name + "#ON")
            sys.stdout.flush()
        else:
            print(output_name + "#OFF")
            sys.stdout.flush()


    def set(self, output_name, value):
        self.revpi.io[output_name].value = value
        #self.revpi.writeprocimg()


    def setOn(self, output_name):
        self.set(output_name, True)


    def setOff(self, output_name):
        self.set(output_name, False)


    def start(self):

        while True:
            sleep(0.25)
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
                

if __name__ == "__main__":
    root = RevPiModDO()
    root.start()
