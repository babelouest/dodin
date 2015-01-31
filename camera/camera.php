<?php
require_once 'config.php';

if (isset($_GET['camera'])) {
  $name = $_GET['camera'];
} else {
  $name = "";
}

header("Content-type: image/png");
header("Cache-Control: no-cache, must-revalidate");
if (isset($configCameras[$name])) {
  $camera = $configCameras[$name];
  $photoDir = $camera['source-path'];
  $curFile = "lastsnap.jpg";
  if (isset($_GET['file'])) {
    $curFile = $_GET['file'];
  }
  if (isset($_GET['alert'])) {
    $photoDir = $camera['triggered-path'];
  }
  if (file_exists("$photoDir/" . $curFile)) {
    $im = imagecreatefromjpeg("$photoDir/" . $curFile);
    if (!isset($_GET['large'])) {
      $rsr_scl = imagecreatetruecolor(640, 480);
      imagecopyresized($rsr_scl, $im, 0, 0, 0, 0, 640, 480, imagesx($im), imagesy($im));
      imagejpeg($rsr_scl);
      imagedestroy($rsr_scl);
    } else {
      imagejpeg($im);
    }
  } else {
    $im = imagecreatefromjpeg("no_image.jpg");
    imagejpeg($im);
  }
  imagedestroy($im);
} else {
  $im = imagecreatefromjpeg("no_image.jpg");
  imagejpeg($im);
  imagedestroy($im);
}
