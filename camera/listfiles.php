<?php
require_once 'config.php';

if (isset($_GET['device']) && isset($camera[$_GET['device']])) {
  $photoDir = $sourcePath.$camera[$_GET['device']].'/';
  if (isset($_GET['alert']) && ($_GET['alert'] == 'true')) {
    $photoDir .= ($triggered.'/');
    $filesFilter = $triggFilesFilter;
  } else {
    $filesFilter = $schedFilesFilter;
  }
  $fileList = array_reverse(glob($photoDir.$filesFilter));
  $output = array();
  foreach ($fileList as $oneFile) {
    $output[] = end(split('/', $oneFile));
  }
  print json_encode(array('result' => 'ok', 'list' => $output));
} else {
  print(json_encode(array('result' => 'error', 'message' => 'no device specified')));
}
