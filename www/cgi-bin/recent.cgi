#!/usr/bin/perl

use strict;
use warnings;

BEGIN {
	unshift @INC, 'lib/perl5';
	unshift @INC, '/mnt/sd/www/cgi-bin/lib/perl5';
}

sub children {
	my ($dir) = @_;
	my $ret = [];
	opendir my $dh, $dir || die;
	while(readdir $dh) {
		next if $_ =~ /^\./;
		push @$ret, {
			path => "$dir/$_",
			basename =>  $_,
		};
	}
	closedir $dh;
	wantarray ? @$ret : $ret;
}

my $DCIM = '/mnt/sd/DCIM';

my $files = [];

LOOP: for my $dir (sort { $b cmp $a } children($DCIM)) {
	my $name = $dir->{basename};
	$name eq '199_WIFI' and next;
	$name =~ /\d\d\d[a-z_]+/i or next;

	for my $file (sort { $b cmp $a } children($dir->{path})) {
		$file->{path} =~ /\.jpg$/i or next;
		push @$files, $file;
		if (@$files >= 24) {
			last LOOP;
		}
	}
}

print "Content-Type: text/csv; charset=utf-8\n\n";

for my $file (@$files) {
	my $stat = [ stat($file->{path}) ];
	my $path = $file->{path};
	$path =~ s{^$DCIM/}{};
	print(join("\t", $path, $stat->[10], $stat->[7]), "\n");
}

