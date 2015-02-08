<?php
require_once 'config.php';

if (isset($_GET['camera']) && isset($configCameras[$_GET['camera']])) {
  $camera = $configCameras[$_GET['camera']];
  $photoDir = $camera['scheduled-path'].'/';
  if (isset($_GET['alert'])) {
    $photoDir = $camera['triggered-path'].'/';
    $filesFilter = $camera['triggered-files-filter'];
  } else {
    $filesFilter = $camera['scheduled-files-filter'];
  }
  $fileList = array_reverse(glob($photoDir.$filesFilter));
  $output = array();
  foreach ($fileList as $oneFile) {
    $output[] = end(split('/', $oneFile));
  }
  print json_encode(array('result' => 'ok', 'list' => $output));
} else {
  $cameras = array();
  foreach ($configCameras as $oneCamera) {
    $cameras[] = array('name' => $oneCamera['name'], 'description' => $oneCamera['description']);
  }
  print(json_encode(array('result' => 'ok', 'cameras' => $cameras)));
}
