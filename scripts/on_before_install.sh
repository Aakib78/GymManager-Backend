#!/bin/bash

#Download node and npm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
. ~/.nvm/nvm.sh
nvm install v22.14.0

DIR="/home/ubuntu/my-gym-manager"
if [ -d "$DIR" ]; then
  echo "${DIR} exists on your filesystem."
else
  echo "${DIR} does not exist on your filesystem."
  mkdir $DIR
fi