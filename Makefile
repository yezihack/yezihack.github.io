#!/bin/bash

push: add
	git commit -m "push"
	current_branch=$(git_current_branch)
	git push origin "$current_branch"

add:
	git add . --all