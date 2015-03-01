#!/bin/bash

root_dir=`pwd`
test_dir=$root_dir/tests

test_module_dirs[0]="auth-google-express-mongoose"
test_module_dirs[1]="auth-local-express-mongoose"
test_module_dirs[2]="express-mongoose"
test_module_dirs[3]="like-minded"
test_module_dirs[4]="tree-branch"

function PRINT_TITLE {
    title=$1
    size=$((${#title} + 10))
    line=`printf "=%.0s" $(seq 1 $size)`
    echo $line
    echo "==== $title ===="
    echo $line
    echo
}

cd $test_dir
npm install

for dir in ${test_module_dirs[*]}
do

    PRINT_TITLE $dir

    test_module_dir=$test_dir/$dir
    tests_dir=$test_module_dir/tests

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
    npm start
    sleep 1
    npm test

    if [ "$?" -ne "0" ]
    then
        npm logs
        exit 1
    fi

    npm stop
    sleep 1

done
