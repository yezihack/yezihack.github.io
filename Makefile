#!/bin/bash

dev:
	hugo server -w

github:
	git add -A && git commit -m "fix" && git push
	./start.sh github

sgfoot:
	git pull 
	./start.sh sgfoot
.PHONY: dev issue "issue"
