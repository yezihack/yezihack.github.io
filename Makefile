#!/bin/bash

gen:
	hugo

sync:
	hugo 
	# save src

	echo "start save blog files"
	git checkout src && git add -A && git commit -m "save blog" && git push origin src:src -f
	echo "end"

	# push yezihack.github.io	
	echo "start sync yezihack.github.io"
	cd public/ && git checkout master && git add -A && git commit -m "sync blog" && git push origin master:master -f

	# checkout src
	git checkout src
