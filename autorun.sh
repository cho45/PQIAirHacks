#!/bin/sh
export PATH=$PATH:/mnt/sd/bin
ln -s /mnt/sd/www/recent /www/recent
ln -s /mnt/sd/www/cgi-bin/recent.cgi /www/cgi-bin/recent.cgi
sync
