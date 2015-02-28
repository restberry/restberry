#!/bin/bash

root_dir=`pwd`
test_dir=$root_dir/tests

test_module_dirs[0]="auth-google-express-mongoose"
test_module_dirs[1]="auth-local-express-mongoose"
test_module_dirs[2]="express-mongoose"
test_module_dirs[3]="like-minded"

function PRINT_TITLE {
    title=$1
    size=$((${#title} + 10))
    line=`printf "=%.0s" $(seq 1 $size)`
    echo $line
    echo "==== $title ===="
    echo $line
    echo
}

for dir in ${test_module_dirs[*]}
do

    PRINT_TITLE $dir

    test_module_dir=$test_dir/$dir
    tests_dir=$test_module_dir/tests
    node_app=app.js
    node_app_path=$test_module_dir/$node_app

    if [ ! -d $test_module_dir ]
    then
        echo "couldn't find $test_module_dir";
        exit 1
    fi

    export NODE_HOST=`ifconfig | grep 'eth0' -C 2 | grep 'inet addr:' |
                      grep -v '127.0.0.1' | cut -d: -f2 | awk '{print $1}'`
    export NODE_PORT=5115
    export NODE_PATH=$test_dir

    cd $test_module_dir
    npm install
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
