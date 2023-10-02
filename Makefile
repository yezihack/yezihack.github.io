#!/bin/bash

push: add
	git commit -m "push"
	git push origin "$(git_current_branch)"

add:
	git add . --all