#!/bin/bash

dev:
	hugo server -w

issue:
	./start.sh issue

.PHONY: dev issue "issue"
