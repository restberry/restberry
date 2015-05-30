#!/bin/bash

root_dir=`pwd`

if [ -c $RESTBERRY_TEST ]
then
    test_module_dirs[0]="auth-local-express-mongoose"
    test_module_dirs[1]="express-mongoose"
    test_module_dirs[2]="mongoose"
    test_module_dirs[3]="like-minded"
    test_module_dirs[4]="tree-branch"
else
    test_module_dirs[0]=$RESTBERRY_TEST
fi

function PRINT_TITLE {
    title=$1
    size=$((${#title} + 10))
    line=`printf "=%.0s" $(seq 1 $size)`
    echo
    echo $line
    echo "==== $title ===="
    echo $line
    echo
}

function POST_INSTALL {
    rm -r node_modules/restberry
    ln -s ../../.. node_modules/restberry
}

PRINT_TITLE "INSTALL TESTS"

npm install

for dir in ${test_module_dirs[*]}
do

    PRINT_TITLE $dir

    test_module_dir=$root_dir/$dir
    cd $test_module_dir
    npm install
    POST_INSTALL

done

PRINT_TITLE "RUN TESTS"

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
    npm stop &> /dev/null
    npm start

    if [ "$?" -ne "0" ]
    then
        npm logs
        exit 1
    fi

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
