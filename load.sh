#!/bin/sh

#set -x

cat $1 | cut -d'|' -f1,10,11,4,5 | sed s/'|'/' '/g |
    while read e h c lng lat; do
            lat=`echo $lat | sed s/','/'.'/ | sed s/','//g`
            lng=`echo $lng | sed s/','/'.'/ | sed s/','//g`
	    echo "$e $h $c $lat $lng"
            echo "{\"corp\": \"$e\", \"time\": \"$h\", \"amplitude\": $c, \"latlng\":{\"lat\": $lat, \"lng\": $lng}}";
	    echo "{\"corp\": \"$e\", \"time\": \"$h\", \"amplitude\": \"$c\", \"latlng\":{\"lat\": \"$lat\", \"lng\": \"$lng\"}}" | curl -H 'X-Auth-Token: 97f0ad9e24ca5e0408a269748d7fe0a0' -d @- http://localhost:3000/collectionapi/markers;
    done
