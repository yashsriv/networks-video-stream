#!/bin/bash

rm -rf ./dist
mkdir -p ./dist
go build -o ./dist/server .
cd frontend && yarn build:prod
cd .. && cp -r ./frontend/dist/frontend ./dist/build
