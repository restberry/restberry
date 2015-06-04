#!/bin/bash

source ./util.sh
PRINT_TITLE "RUN TESTS"

npm stopall &> /dev/null

for dir in ${test_module_dirs[*]}
do

    PRINT_TITLE $dir

    test_module_dir=$root_dir/$dir
    tests_dir=$test_module_dir/tests

    if [ ! -d $test_module_dir ]
    then
        echo "couldn't find $test_module_dir";
        exit 1
    fi

    export NODE_HOST=`ifconfig | grep 'eth0' -C 2 | grep 'inet addr:' |
                      grep -v '127.0.0.1' | cut -d: -f2 | awk '{print $1}'`
    export NODE_PORT=5115

    cd $test_module_dir
    npm start

    if [ "$?" -ne "0" ]
    then
        npm run logs
        npm stop
        exit 1
    fi

    sleep 1
    npm test

    if [ "$?" -ne "0" ]
    then
        npm run logs
        npm stop
        exit 1
    fi

    npm stop
    sleep 1

done
