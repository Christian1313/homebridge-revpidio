#!/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import revpimodio2

# Takes first name and last name via command
# line arguments and then display them

class RevPiModDO():

    def __init__(self):
        # RevPiModIO Instantieren
        self.revpi = revpimodio2.RevPiModIO(autorefresh=False)

    def setOn(self, output_name):
        self.revpi.io[output_name].value = True
        self.revpi.writeprocimg()
        print("SET__ON:" + output_name)

    def setOff(self, output_name):
        self.revpi.io[output_name].value = False
        self.revpi.writeprocimg()
        print("SET_OFF:" + output_name)


if __name__ == "__main__":
    root = RevPiModDO()
    if sys.argv[1] == 'ON':
        root.setOn(sys.argv[2])
    elif sys.argv[1] == 'OFF':
        root.setOff(sys.argv[2])
