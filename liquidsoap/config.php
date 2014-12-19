<?php

/*$host = 'localhost';
$port = 1201;
$requestName = 'fluxMP3';*/

$fields = array("title", "artist", "albumartist", "year", "album");
$commands = array("skip", "stop", "start", "status", "remaining");

$streams = array(
		"radiolocomp3" => array("name" => "Radio Loco MP3 (128 kb, stereo)", "url" => "/radio/flux.mp3", "type" => "audio/mpeg", "host" => "localhost", "port" => "1201", "requestName" => "fluxMP3"), 
		"radiolocoogg" => array("name" => "Radio Loco OGG (64 kb, mono)", "url" => "/radio/flux.ogg", "type" => "audio/ogg", "host" => "localhost", "port" => "1201", "requestName" => "fluxOGG"),
		"radioclassic" => array("name" => "Radio Classic (128 kb, stereo)", "url" => "/radio/classic.mp3", "type" => "audio/mpeg", "host" => "localhost", "port" => 1202, "requestName" => "ClassicMP3")
	);

?>
