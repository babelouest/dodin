<?php
require_once 'config.php';

if (isset($_GET['device'])) {
  $device = $_GET['device'];
} else {
  $device = "";
}

header("Content-type: image/png");
header("Cache-Control: no-cache, must-revalidate");
if (isset($camera[$device])) {
  $photoDir = $sourcePath.$camera[$device];
  $curFile = "lastsnap.jpg";
  if (isset($_GET['file'])) {
    $curFile = $_GET['file'];
  }
  if (isset($_GET['alert']) && $_GET['alert'] == 'true') {
    $photoDir .= ('/'.$triggered);
  }
error_log($photoDir);
  $im = imagecreatefromjpeg("$photoDir/" . $curFile);
  $rsr_scl = imagecreatetruecolor(640, 480);
  imagecopyresized($rsr_scl, $im, 0, 0, 0, 0, 640, 480, 1280, 1024);
  imagejpeg($rsr_scl);
  imagedestroy($rsr_scl);
} else {
  $im = imagecreatefromjpeg("no_image.jpg");
  imagejpeg($im);
}
imagedestroy($im);
