#!/bin/bash

year=`date +%Y`
month=`date +%m`

start: 
	hugo server --bind=127.0.0.1 -p 80 --baseURL=http://100.sgfoot.com

dev:
	hugo server -w

new:
	hugo new site ${year}/${month}/
date:
	@echo ${year}
	@echo ${month}
.PHONY: start dev new date
