#!/bin/bash

root_dir=`pwd`
test_dir=$root_dir/tests

test_module_dirs[0]="auth-google-express-mongoose"
test_module_dirs[1]="auth-local-express-mongoose"
test_module_dirs[2]="express-mongoose"

for dir in ${test_module_dirs[*]}
do

    echo "========================================="
    echo "===== $dir ====="
    echo "========================================="
    echo

    test_module_dir=$test_dir/$dir
    tests_dir=$test_module_dir/tests
    node_app=app.js
    node_app_path=$test_module_dir/$node_app

    if [ ! -d $test_module_dir ]
    then
        echo "couldn't find $test_module_dir";
        exit 1
    fi

    export NODE_HOST=`ifconfig | grep 'inet addr:' | grep -v '127.0.0.1' |
                      cut -d: -f2 | awk '{ print $1}'`
    export NODE_PORT=5115
    export NODE_PATH=$test_dir

    cd $test_module_dir
    forever start $node_app
    sleep 1
    nodeunit $tests_dir

    if [ "$?" -ne "0" ]
    then
        forever logs $node_app
        exit 1
    fi

    forever stop $node_app
    sleep 1

done
