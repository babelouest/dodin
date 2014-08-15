<?php

require("./re-mpd.class.php");
require("./config.php");

if (isset($_GET["device"])) {
    $output = array();
    if (isset($_GET["servers"])) {
        foreach ($servers as $oneServer) {
            if ($oneServer["device"] == $_GET["device"]) {
                $output[] = array("name" => $oneServer["name"], "display" => $oneServer["display"]);
            }
        }
        
    } elseif (isset($_GET["server"]) && isset($_GET["status"])) {
        $server = getServer($servers, $_GET["device"], $_GET["server"]);
        if ($server == null) {
            $output = array("result" => "error", "message" => "Server not found");
        } else {
            $myMpd = new Mpd($server["host"], $server["port"], $server["password"] == "" ? null : $server["password"]);
            if (!$myMpd->connected) {
                $output = array("result" => "error", "message" => "Could not connect to server");
            } else {
                if (($myMpd->state == MPD_STATE_PLAYING) || ($myMpd->state == MPD_STATE_PAUSED)) {
                    $track = $myMpd->playlist[$myMpd->currentTrackID];
                    
                    $state = $myMpd->state == MPD_STATE_PLAYING?"playing":"paused";
                    $title = isset($track['Title']) ? $track['Title'] : "";
                    $artist = isset($track['Artist']) ? $track['Artist'] : "";
                    $album = isset($track['Album']) ? $track['Album'] : "";
                    $date = isset($track['Date']) ? $track['Date'] : "";
                    
                } else {
                    $state = "stopped";
                    $title = "";
                    $artist = "";
                    $album = "";
                    $date = "";
                }
                $output = array("result" => "ok", 
                                "state" => $state,
                                "title" => $title,
                                "artist" => $artist,
                                "album" => $album,
                                "date" => $date,
                                "volume" => $myMpd->volume
                                );
            }

        }
    } elseif (isset($_GET["server"]) && isset($_GET["stop"])) {
        $server = getServer($servers, $_GET["device"], $_GET["server"]);
        if ($server == null) {
            $output = array("result" => "error", "message" => "Server not found");
        } else {
            $myMpd = new Mpd($server["host"], $server["port"], $server["password"] == "" ? null : $server["password"]);
            if (!$myMpd->connected) {
                $output = array("result" => "error", "message" => "Could not connect to server");
            } else {
                $result = $myMpd->Stop();
                $output = array("result" => "ok", "volume" => $myMpd->volume);
            }
        }
    } elseif (isset($_GET["server"]) && isset($_GET["play"])) {
        $server = getServer($servers, $_GET["device"], $_GET["server"]);
        if ($server == null) {
            $output = array("result" => "error", "message" => "Server not found");
        } else {
            $myMpd = new Mpd($server["host"], $server["port"], $server["password"] == "" ? null : $server["password"]);
            if (!$myMpd->connected) {
                $output = array("result" => "error", "message" => "Could not connect to server");
            } else {
                $result = $myMpd->Play();
                $track = $myMpd->playlist[$myMpd->currentTrackID];
                
                $state = $myMpd->state == MPD_STATE_PLAYING?"playing":"paused";
                $title = isset($track['Title']) ? $track['Title'] : "";
                $artist = isset($track['Artist']) ? $track['Artist'] : "";
                $album = isset($track['Album']) ? $track['Album'] : "";
                $date = isset($track['Date']) ? $track['Date'] : "";

                $output = array("result" => "ok", 
                                "state" => $state,
                                "title" => $title,
                                "artist" => $artist,
                                "album" => $album,
                                "date" => $date,
                                "volume" => $myMpd->volume
                                );
            }
        }
    } elseif (isset($_GET["server"]) && isset($_GET["volume"])) {
        $server = getServer($servers, $_GET["device"], $_GET["server"]);
        if ($server == null) {
            $output = array("result" => "error", "message" => "Server not found");
        } elseif (!is_numeric($_GET["volume"])) {
            $output = array("result" => "error", "message" => "volume is not a numeric value");
        } else {
            $myMpd = new Mpd($server["host"], $server["port"], $server["password"] == "" ? null : $server["password"]);
            if (!$myMpd->connected) {
                $output = array("result" => "error", "message" => "Could not connect to server");
            } else {
                $result = $myMpd->SetVolume(intval($_GET["volume"]));
                $output = array("result" => "ok",
                                "volume" => $myMpd->volume,
                                );
            }
        }
    } else {
        $output = array("result" => "error",
                        "message" => "command not recognized");
    }
    echo json_encode($output);
}

function getServer($servers, $device, $name) {
    foreach ($servers as $oneServer) {
        if ($oneServer["device"] == $device && $oneServer["name"] == $name) {
            return $oneServer;
        }
    }
    return null;
}
