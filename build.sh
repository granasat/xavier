#!/bin/sh

cd frontend/
rm -rf ./dist
yarn build

cd ..
cp -r ./frontend/dist ./backend

