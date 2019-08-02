#!/bin/bash

start: 
	hugo server --bind=127.0.0.1 -p 80 --baseURL=http://100.sgfoot.com

dev:
    hugo server -w

stop:
