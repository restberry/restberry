#!/bin/bash

source ./util.sh

PRINT_TITLE "TEST $NODE_PORT" "====="

npm stopall &> /dev/null

for dir in ${test_module_dirs[*]}
do

    echo
    PRINT_TITLE $dir

    test_module_dir=$root_dir/$dir
    tests_dir=$test_module_dir/tests

    if [ ! -d $test_module_dir ]
    then
        echo "couldn't find $test_module_dir"
        exit 1
    fi

    cd $test_module_dir
    npm start

    if [ "$?" -ne "0" ]
    then
        npm run logs
        npm stop
        exit 1
    fi

    sleep $NODE_SLEEP
    npm test

    if [ "$?" -ne "0" ]
    then
        npm run logs
        npm stop
        exit 1
    fi

    npm stop
    sleep $NODE_SLEEP

done
