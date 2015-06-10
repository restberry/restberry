#!/bin/bash

function POST_INSTALL {
    rm -r node_modules/restberry
    ln -s ../../.. node_modules/restberry
}

source ./util.sh

PRINT_TITLE "INSTALL TESTS"

for dir in ${test_module_dirs[*]}
do

    echo
    PRINT_TITLE $dir
    echo

    test_module_dir=$root_dir/$dir
    cd $test_module_dir

    if [ `pwd` == $test_module_dir ]
    then
        npm install
        POST_INSTALL
    fi

done
