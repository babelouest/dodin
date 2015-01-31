<?php
require_once 'config.php';

if (isset($_GET['camera'])) {
  $name = $_GET['camera'];
} else {
  $name = "";
}

if (isset($configCameras[$name])) {
  $url = $configCameras[$name]['stream-url'];
  header('Location: '.$url);
} else {
  header('Location: no_image.jpg');
}
