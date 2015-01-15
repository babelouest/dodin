<?php

require_once 'config.php';
if (isset($_GET['action'])) {

	$action = $_GET['action'];
	if ($action === 'streams') {
		$output = array();
		foreach ($streams as $name => $stream) {
			$output[$name] = array('name' => $stream['name'], 'url' => $stream['url'], 'type' => $stream['type']);
		}
		echo json_encode($output);
	} else if (isset($_GET['stream']) && isset($streams[$_GET['stream']])) {
		$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
		
		if ($socket === false) {
			echo json_encode(array('error' => "socket_create() failed :  " . socket_strerror(socket_last_error()) . "\n"));
		} else {
			$stream				= $streams[$_GET['stream']];
			$name					= $stream['name'];
			$url					= $stream['url'];
			$type					= $stream['type'];
			$host					= $stream['host'];
			$port					= $stream['port'];
			$requestName	= $stream['requestName'];
			
			$result = socket_connect($socket, $host, $port);
			if ($socket === false) {
				echo json_encode(array('error' => "socket_connect() failed : ($result) " . socket_strerror(socket_last_error($socket)) . "\n"));
			} else {
			
				if ($action === 'list') {
					$request = "$requestName.metadata\nquit\n";
					$response = array();

					socket_write($socket, $request, strlen($request));
			
					while ($response[] = socket_read($socket, 2048));

					$lines = explode("\n", implode('', $response));
				
					$songs = array();
					$curSong = null;
				
					foreach ($lines as $line) {
						//echo $line." - ".strpos($line, '--- ')."<br>";
						if ((strpos($line, '--- ') === 0) && (strpos($line, ' ---')+strlen(' ---') === strlen($line))) {
							// New song
							if ($curSong != null) {
								$songs[] = $curSong;
							}
							$curSong = array();
							//echo count($songs)."<br>";
						} else if ($line !== 'END' && $line != 'Bye!') {
							$curElt = explode('=', $line);
							if (count($curElt) > 1 && in_array($curElt[0], $fields)) {
								$curSong[$curElt[0]] = trim($curElt[1], " \t\n\r\0\x0B\"");
							}
						}
					}
					if ($curSong != null) {
						$songs[] = $curSong;
					}
					echo json_encode(array_reverse($songs));
				} else if ($action === 'on_air') {
					$request = "request.on_air\n";

					socket_write($socket, $request, strlen($request));

					$onAir = socket_read($socket, 2048, PHP_NORMAL_READ);

					$request = "request.metadata $onAir\nquit\n";

					socket_write($socket, $request, strlen($request));

					$response = array();

					while ($response[] = socket_read($socket, 2048));

					$lines = explode("\n", implode('', $response));
					
					$curSong = null;
					$fallback = array('title' => 'Error getting values', 'artist' => 'Error getting values', 'album' => 'Error getting values', 'year' => 'Error getting values', 'albumartist' => 'Error getting values');
					
					foreach ($lines as $line) {
						if ($line !== 'END' && $line != 'Bye!') {
							$curElt = explode('=', $line);
							if (count($curElt) > 1 && in_array($curElt[0], $fields)) {
							$curSong[$curElt[0]] = trim($curElt[1], " \t\n\r\0\x0B\"");
							}
						}
					}
					echo json_encode($curSong===null?$fallback:$curSong);
				} else if ($action === 'request') {
					if (isset($_GET['command']) && in_array($_GET['command'], $commands)) {
						$request = $requestName.".".$_GET['command']."\nquit\n";

						socket_write($socket, $request, strlen($request));

						$response = socket_read($socket, 2048);
						echo json_encode(array('command' => $_GET['command'], 'response' => $response));
					} else {
						echo json_encode(array('error' => 'unknown command', 'command' => $_GET['command']));
					}
				} else {
					echo json_encode(array('error' => 'unknown action', 'action' => $_GET['action']));
				}
			}
		}
		socket_close($socket);
	} else {
		echo json_encode(array('error' => 'Stream not specified or stream not found'));
	}

} else {
	echo json_encode(array('error' => 'Action not specified'));
}
?>
