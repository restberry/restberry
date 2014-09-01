#!/bin/bash

export NODE_PORT=5115
export NODE_HOST=`ifconfig | grep 'inet addr:' | grep -v '127.0.0.1' |
                  cut -d: -f2 | awk '{ print $1}'`

root_dir=`pwd`
test_dir=$root_dir/tests
tests_dir=$test_dir/tests
node_app=app.js
node_app_path=$test_dir/$node_app

cd $test_dir
forever stop $node_app
forever start $node_app
sleep 1

nodeunit $tests_dir

forever logs $node_app
