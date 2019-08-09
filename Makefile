#!/bin/bash

dev:
	hugo server -w

github:
	git add -A && git commit -m "fix" && git push
	./start github

.PHONY: dev issue "issue"
