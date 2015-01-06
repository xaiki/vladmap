#!/bin/sh

#set -x

cat $1 | grep -ve EMPRESA | cut -d'|' -f1,5,7,10,11 | sed s/'|'/' '/g |
    while read e c d h lng lat; do
            lat=`echo $lat | sed s/','/'.'/ | sed s/','//g`
            lng=`echo $lng | sed s/','/'.'/ | sed s/','//g`
	    echo "$e $h $c $lat $lng"
            echo "{\"corp\": \"$e\", \"date\": \"$d $h\", \"amplitude\": $c, \"latlng\":{\"lat\": $lat, \"lng\": $lng}}";
	    echo "{\"corp\": \"$e\", \"date\": \"$d $h\", \"amplitude\": \"$c\", \"latlng\":{\"lat\": \"$lat\", \"lng\": \"$lng\"}}" | curl -H 'X-Auth-Token: 97f0ad9e24ca5e0408a269748d7fe0a0' -d @- http://localhost:3000/collectionapi/markers;
    done
