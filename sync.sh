#!/bin/bash

rsync -r --exclude=node_modules/ --exclude=files/ . crawld.jaz-lounge.com:~/crawld
