#!/bin/bash

root_dir=`pwd`

export NODE_PORT=5115
export NODE_SLEEP=5

if [ -c $RESTBERRY_TEST ]
then
    test_module_dirs[0]="auth-local-express-mongoose"
    test_module_dirs[1]="auth-local-restify-mongoose"
    test_module_dirs[2]="default"
    test_module_dirs[3]="express-mongoose"
    test_module_dirs[4]="mongoose"
    test_module_dirs[5]="like-minded"
    test_module_dirs[6]="restify-mongoose"
    test_module_dirs[7]="tree-branch"
else
    test_module_dirs[0]=$RESTBERRY_TEST
fi

function PRINT_TITLE {
    title=$1
    side=$2
    if [ -z $side ]
    then
        side="="
    fi

    side_len=${#side}
    title_len=${#title}
    len=$(($title_len + 2 * $side_len + 2))
    line=`printf "=%.0s" $(seq 1 $len)`

    echo $line
    echo "$side $title $side"
    echo $line
}
